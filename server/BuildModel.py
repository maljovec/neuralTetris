""" This module will fill in the gaps coming from a Tetris rethinkdb instance
    and test training a neural network using keras.
"""

import numpy as np
import pandas as pd
import rethinkdb as rdb

from keras.models import Sequential, Model
from keras.layers import Input, Dense, Activation, Conv2D, Reshape, Flatten, Concatenate
from keras.callbacks import ModelCheckpoint

from time import time

WIDTH = 10
HEIGHT = 22
USER = 8

def encode_letter(letter):
    """
        This will encode a tetromino letter as a small integer
    """
    value = None
    if letter == 'i':
        value = 0
    elif letter == 'j':
        value = 1
    elif letter == 'l':
        value = 2
    elif letter == 'o':
        value = 3
    elif letter == 's':
        value = 4
    elif letter == 't':
        value = 5
    elif letter == 'z':
        value = 6
    return value

def train(user_id, reconstruct_missing_data=False, balance_data=False):
    """
        Train a neural network model for a given user
        Keyword arguments:

        user_id - the user id key in the database for which we will be building
                  a brain.
        reconstruct_missing_data - A boolean flag for specifying whether
                                   non-input ticks of the game should be put
                                   back into the filtered data. This can cause
                                   more noise in an already class-imbalanced
                                   problem, default is False.
        balance_data - A boolean flag for specifying whether we should attempt
                       to remove the bias caused by the player being "idle" most
                       of the time. We can do this by oversampling the non-zero
                       elements or undersampling the zero input entries. Note,
                       this is not mutually exclusive of the
                       reconstruct_missing_data flag as we can oversample our
                       non-zero elements to equalize that case, though the
                       effect may be slower training times without much added
                       benefit.
    """
    parameters = []
    for row in range(HEIGHT):
        for col in range(WIDTH):
            parameters.append('board_{}_{}'.format(row, col))

    parameters.append('currentPiece')
    parameters.append('nextPiece')
    parameters.append('timeDelay')

    counts = []
    counts.append('iCount')
    counts.append('jCount')
    counts.append('lCount')
    counts.append('oCount')
    counts.append('sCount')
    counts.append('tCount')
    counts.append('zCount')

    parameters += counts
    target = 'input'
    columns = ['gameId', 'ticks'] + parameters + [target]

    ############################################################################
    ## Retrieve data from database
    print('Retrieving data from database...', end="")
    start = time()

    connection = rdb.connect('localhost', 28015)

    training_data = rdb.db('Tetris').table('moves')\
                                    .order_by(index='userGameTick')\
                                    .filter((rdb.row['userId'] == user_id))\
                                    .pluck(columns).run(connection)
    training_data = pd.DataFrame([row for row in training_data])

    end = time()
    print('Done ({} s)'.format(end-start))
    ############################################################################
    ## Reconstruct missing data by filling in the missing ticks with zero input
    if reconstruct_missing_data:
        print('Reconstructing missing data...', end="")
        start = time()

        new_rows = []
        last_row = None
        for index, row in training_data.iterrows():
            if last_row is not None and last_row['gameId'] == row['gameId']:
                if row['ticks'] != last_row['ticks']+1:
                    for tick in range(last_row['ticks']+1, row['ticks']):
                        new_row = last_row.copy()
                        new_row['ticks'] = tick
                        new_row['input'] = 0
                        new_rows.append(new_row)
            last_row = row

        new_rows = pd.DataFrame(new_rows)
        training_data = pd.concat([training_data, new_rows], ignore_index=True)

        end = time()
        print('Done ({} s)'.format(end-start))
    ############################################################################
    ## Re-balance the data set if possible
    if balance_data:
        print('Balance registered inputs...', end="")
        start = time()

        ## none/none/none = 0+0+0 = 0
        ## none/none/down = 0+0+9 = 9

        ## left/none/none = 1+0+0 = 1
        ## right/none/none = 2+0+0 = 2
        ## none/CCW/none = 0+3+0 = 3
        ## none/CW/none = 0+6+0 = 6

        ## right/CCW/none = 2+3+0 = 5
        ## right/CW/none = 2+6+0 = 8
        ## left/CCW/none = 1+3+0 = 4
        ## left/CW/none = 1+6+0 = 7
        ## none/CCW/down = 0+3+9 = 12

        ## Equalizing values
        # input_counts = training_data[target].value_counts().to_dict()
        # total_count = training_data.shape[0]
        # for value, count in input_counts.items():
        #     percent = count / float(total_count)

        ## Just duplicate the non-zero and non-drop elements for now
        nonzero_rows = training_data.loc[training_data[target] != 0 ]
        nonzero_rows = nonzero_rows.loc[nonzero_rows[target] != 9 ]

        num_op = nonzero_rows.shape[0]
        num_noop = training_data.shape[0] - num_op

        print('Class balance: op ({}) vs noop ({})'.format(num_op, num_noop))

        while num_op*2 < num_noop:
            training_data = pd.concat([training_data, nonzero_rows], ignore_index=True)
            num_op *= 2

        end = time()
        print('Done ({} s)'.format(end-start))
    ############################################################################
    ## Create the training data
    print('Massaging data...', end="")
    start = time()

    for piece in ['currentPiece', 'nextPiece']:
        training_data[piece] = training_data[piece].apply(encode_letter)

    train_x = training_data[parameters].as_matrix()

    ## remove the offsets on the piece statistics, we only really care which
    ## pieces have yet to drawn from the current bag
    col = -len(counts)
    for i in range(len(train_x)):
        train_x[i][col:] = train_x[i][col:] - min(train_x[i][col:])

    user_inputs = training_data[target].as_matrix()
    unique_inputs = np.unique(user_inputs)
    num_unique_inputs = len(unique_inputs)
    train_y = np.zeros((user_inputs.shape[0], num_unique_inputs), dtype=int)
    for i, inp in enumerate(user_inputs):
        train_y[i] = np.array(unique_inputs == inp, dtype=int)

    ############################################################################
    ## Reorganize the data to allow it to be passed in as separate layers

    boardData = train_x[:, :WIDTH*HEIGHT]
    boardData = boardData.reshape(-1, HEIGHT, WIDTH)
    currentData = train_x[:, WIDTH*HEIGHT]
    nextData = train_x[:, WIDTH*HEIGHT+1]
    timeData = train_x[:, WIDTH*HEIGHT+2]
    bagData = train_x[:, WIDTH*HEIGHT+3:]
    pieceData = np.vstack([currentData,nextData]).T

    end = time()
    print('Done ({} s)'.format(end-start))

    ############################################################################
    ## Build the NN architecture (this is where we can play around)
    print('Specifying neural architecture...', end="")
    start = time()

    board_shape = (HEIGHT, WIDTH)
    board_input = Input(shape=board_shape, dtype=np.float32, name='board_input')
    bag_input = Input(shape=(7,), dtype=np.float32, name='bag_input')
    piece_input = Input(shape=(2,), dtype=np.float32, name='piece_input')
    speed_input = Input(shape=(1,), dtype=np.float32, name='speed_input')

    conv_input = Reshape(board_shape + (1, ), input_shape=board_shape)(board_input)
    conv_output = Conv2D(filters=32, kernel_size=3, strides=1, padding='valid', activation='relu', name='layer1_conv3-32')(conv_input)
    conv_output = Conv2D(filters=32, kernel_size=3, strides=1, padding='valid', activation='relu', name='layer2_conv3-32')(conv_output)
    conv_output = Conv2D(filters=64, kernel_size=3, strides=1, padding='valid', activation='relu', name='layer3_conv3-64')(conv_output)
    flattened_output = Flatten()(conv_output)

    secondary_input = Concatenate()([flattened_output, bag_input, piece_input, speed_input])

    secondary_input = Dense(128, activation='relu')(secondary_input)
    secondary_input = Dense(512, activation='relu')(secondary_input)
    secondary_input = Dense(13, activation='relu')(secondary_input)
    final_output = Dense(num_unique_inputs, activation='softmax')(secondary_input)

    model = Model([board_input, bag_input, piece_input, speed_input], outputs=[final_output])
    model.compile(loss='categorical_crossentropy', optimizer='sgd', metrics=['accuracy'])

    filepath="weights-improvement-{epoch:02d}-{acc:.2f}.hdf5"
    checkpoint = ModelCheckpoint(filepath, monitor='acc', verbose=1, save_best_only=True, mode='max')
    callbacks_list = [checkpoint]

    end = time()
    print('Done ({} s)'.format(end-start))
    ############################################################################
    ## Fit the model
    start = time()

    history = model.fit([boardData, bagData, pieceData, timeData], train_y, epochs=100, batch_size=1, callbacks=callbacks_list)

    end = time()

    ## Print after the fact, since Tensorflow will be providing some
    ## intermediate output to let the user know something is happening.
    print('Fitting the model...', end="")
    print('Done ({} s)'.format(end-start))
    return model, unique_inputs

nnet, classes = train(USER, False, True)
model_file = 'user_{}.h5'.format(USER)
inputs_file = 'user_{}.csv'.format(USER)

nnet.save(model_file)
np.savetxt(inputs_file, classes, fmt='%d', delimiter=',')

print('Model saved as \"{}\" with inputs saved to \"{}\"'.format(model_file, inputs_file))