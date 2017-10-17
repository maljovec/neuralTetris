""" This module will fill in the gaps coming from a Tetris rethinkdb instance
    and test training a neural network using keras.
"""

import numpy as np
import pandas as pd
import rethinkdb as rdb

from keras.models import Sequential
from keras.layers import Dense, Activation

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

def train(user_id):
    """
        Train a neural network model for a given user
        Keyword arguments:

        user_id - the user id key in the database for which we will be building
                  a brain.
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

    ############################################################################
    ## Retrieve data from database
    print('Retrieving data from database...', end="")
    start = time()

    connection = rdb.connect('localhost', 28015)

    columns = ['gameId', 'ticks'] + parameters + [target]

    training_data = rdb.db('Tetris').table('moves')\
                                    .filter((rdb.row['userId'] == user_id))\
                                    .order_by('gameId', 'ticks')\
                                    .pluck(columns).run(connection)
    training_data = pd.DataFrame([row for row in training_data])

    end = time()
    print('Done ({} s)'.format(end-start))
    ############################################################################
    ## Reconstruct missing data by filling in the missing ticks with zero input
    print('Reconstructing missing data...', end="")
    start = time()

    rows_to_add = []
    last_row = None
    for index, row in training_data.iterrows():
        if last_row is not None and last_row['gameId'] == row['gameId']:
            if row['ticks'] != last_row['ticks']+1:
                for tick in range(last_row['ticks']+1, row['ticks']):
                    new_row = last_row.copy()
                    new_row['ticks'] = tick
                    new_row['input'] = 0
                    rows_to_add.append(new_row)
        last_row = row

    rows_to_add = pd.DataFrame(rows_to_add)
    training_data = pd.concat([training_data, rows_to_add], ignore_index=True)

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
    for i in range(len(train_x)):
        train_x[i][-len(counts):] = train_x[i][-len(counts):] - min(train_x[i][-len(counts):])

    user_inputs = training_data[target].as_matrix()
    unique_inputs = np.unique(user_inputs)
    num_unique_inputs = len(unique_inputs)
    train_y = np.zeros((user_inputs.shape[0], num_unique_inputs), dtype=int)
    for i, inp in enumerate(user_inputs):
        train_y[i] = np.array(unique_inputs == inp, dtype=int)

    end = time()
    print('Done ({} s)'.format(end-start))
    ############################################################################
    ## Build the NN architecture (this is where we can play around)
    print('Specifying neural architecture...', end="")
    start = time()

    input_dim = len(parameters)
    model = Sequential()
    model.add(Dense(units=5000, input_dim=input_dim))
    model.add(Activation('relu'))
    # model.add(Dense(units=5000, input_dim=input_dim))
    # model.add(Activation('relu'))
    model.add(Dense(units=num_unique_inputs))
    model.add(Activation('relu'))
    model.compile(loss='categorical_crossentropy', optimizer='sgd', metrics=['accuracy'])

    end = time()
    print('Done ({} s)'.format(end-start))
    ############################################################################
    ## Fit the model
    start = time()

    model.fit(train_x, train_y, epochs=1, batch_size=8)

    end = time()
    print('Fitting the model...', end="")
    print('Done ({} s)'.format(end-start))
    return model, unique_inputs

nnet, classes = train(USER)
nnet.save('user_{}.h5'.format(USER))
np.savetxt('user_{}.csv'.format(USER), classes, fmt='%d', delimiter=',')
