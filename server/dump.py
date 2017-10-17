from keras.models import Sequential, Model
from keras.layers import Input, Dense, Activation, Conv2D, Reshape, Flatten

import numpy as np


WIDTH = 10
HEIGHT = 22

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

secondary_input = keras.layers.concatenate([flattened_output, bag_input, piece_input, speed_input])

secondary_input = Dense(128, activation='relu')(secondary_input)
secondary_input = Dense(512, activation='relu')(secondary_input)
secondary_input = Dense(13, activation='relu')(secondary_input)
final_output = Dense(num_unique_inputs, activation='softmax')(secondary_input)


model = Model([board_input, bag_input, piece_input, speed_input], outputs=[final_output])

model = Sequential()
model.add(Dense(units=10000, input_dim=input_dim))
model.add(Activation('relu'))
model.add(Dense(units=num_unique_inputs))
model.add(Activation('relu'))
model.compile(loss='categorical_crossentropy', optimizer='sgd', metrics=['accuracy'])
model.fit(train_x2, train_y2, epochs=1, batch_size=1)


training_data2 = rdb.db('Tetris').table('moves')\
                                .filter((rdb.row['userId'] == user_id))\
                                .order_by('gameId', 'ticks')\
                                .pluck(columns).run(connection)
training_data2 = pd.DataFrame([row for row in training_data2])


for piece in ['currentPiece', 'nextPiece']:
    training_data2[piece] = training_data2[piece].apply(encode_letter)

train_x2 = training_data2[parameters].as_matrix()

## remove the offsets on the piece statistics, we only really care which
## pieces have yet to drawn from the current bag
for i in range(len(train_x2)):
    train_x2[i][-len(counts):] = train_x2[i][-len(counts):] - min(train_x2[i][-len(counts):])

user_inputs = training_data2[target].as_matrix()
unique_inputs = np.unique(user_inputs)
num_unique_inputs = len(unique_inputs)
train_y2 = np.zeros((user_inputs.shape[0], num_unique_inputs), dtype=int)
for i, inp in enumerate(user_inputs):
    train_y2[i] = np.array(unique_inputs == inp, dtype=int)
