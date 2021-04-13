#!/usr/bin/env python

import sys

import asyncio
import websockets
import rethinkdb as rdb
import pandas as pd
import numpy as np
import keras

WIDTH = 10
HEIGHT = 22

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

async def updateDatabase(websocket, path):
    print(f'User connected on: {websocket} with path {path}')
    print('connecting to database...', end='')
    connection = rdb.connect('localhost', 28015)
    print('Connection established')
    gameType = await websocket.recv()

    if gameType == 'Recording':
        while True:
            tetrisMove = await websocket.recv()
            print(f'Data received: {sys.getsizeof(tetrisMove)} bytes')
            move = {}
            tokens = tetrisMove.split(',')
            move['userId'] = int(tokens[0])
            move['gameId'] = int(tokens[1])
            move['ticks'] = int(tokens[2])
            if move['ticks'] < 0:
                print(f'Player {move["userId"]} has lost game {move["gameId"]}. Closing websocket.')
                break

            for row in range(HEIGHT):
                for col in range(WIDTH):
                    move[f'board_{row}_{col}'] = (tokens[3+row*WIDTH+col] != '0')
            move['currentPiece'] = tokens[223]
            move['nextPiece'] = tokens[224]
            move['timeDelay'] = int(tokens[225])
            move['iCount'] = int(tokens[226])
            move['jCount'] = int(tokens[227])
            move['lCount'] = int(tokens[228])
            move['oCount'] = int(tokens[229])
            move['sCount'] = int(tokens[230])
            move['tCount'] = int(tokens[231])
            move['zCount'] = int(tokens[232])
            move['lines'] = int(tokens[233])
            move['score'] = int(tokens[234])
            move['input'] = int(tokens[235])

            rdb.db('Tetris').table('moves').insert(move).run(connection)
            print(f'Tick {move["ticks"]} of {move["gameId"]} for player {move["userId"]} recorded')
    elif gameType == 'Replaying':
        userId = int(await websocket.recv())
        gameId = int(await websocket.recv())

        ## Store the results of this game locally, this will result in a larger
        ## memory footprint, but will mitigate the round trips to the database
        result = rdb.db('Tetris').table('moves').filter((rdb.row['userId'] == userId) & (rdb.row['gameId'] == gameId)).order_by('ticks').pluck(['ticks','input']).run(connection)
        gameData = pd.DataFrame(result)

        ## In case the client requests the same number twice, we want to ignore
        ## it. Granted this should be handled on the client side, but in case
        ## it is not. We have some fault tolerance here.
        processed = set()
        while True:
            tickNumber = int(await websocket.recv())
            if tickNumber < 0:
                print(f'Replay {gameId} has ended for player {userId}. Closing websocket.')
                break
            elif tickNumber in processed:
                continue
            ## This will query the database on each tick
            # result = rdb.db('Tetris').table('moves').filter((rdb.row['userId'] == userId) & (rdb.row['gameId'] == gameId) & (rdb.row['ticks'] == tickNumber)).pluck('input').run(connection)
            # result = [row for row in result]
            # if len(result) == 0:
            #     userInput = 0
            # else:
            #     userInput = result[0]['input']

            ## This will use the locally stored pandas dataframe to quickly
            ## access the data
            ## TODO: more fault tolerance is needed here in case the database
            ## gets corrupted. If the gameData holds more than one row where
            ## the ticks are stored, then this may not work as expected
            matchingInput = gameData.loc[gameData['ticks'] == tickNumber]['input']
            if len(matchingInput) == 1:
                userInput = int(matchingInput)
            else:
                userInput = 0

            processed.add(tickNumber)
            await websocket.send(f'{tickNumber},{userInput}')
            print(f'Sent input code {userInput} for Tick {tickNumber} of {gameId} for player {userId}')
    elif gameType == 'Full State':
        userId = int(await websocket.recv())
        gameId = int(await websocket.recv())
        parameters = ['ticks']
        for row in range(HEIGHT):
            for col in range(WIDTH):
                parameters.append(f'board_{row}_{col}')
        parameters.append('currentPiece')
        parameters.append('nextPiece')
        parameters.append('iCount')
        parameters.append('jCount')
        parameters.append('lCount')
        parameters.append('oCount')
        parameters.append('sCount')
        parameters.append('tCount')
        parameters.append('zCount')
        parameters.append('lines')
        parameters.append('score')

        result = rdb.db('Tetris').table('moves').filter((rdb.row['userId'] == userId) & (rdb.row['gameId'] == gameId)).pluck(parameters).order_by('ticks').run(connection)
        for row in result:
            text = ''
            sep = ''
            for param in parameters:
                datum = str(row[param])
                if 'board' in param:
                    if row[param]:
                        datum = 't'
                    else:
                        datum = ' '

                text += sep + datum
                sep = ','
            await websocket.send(text)
        print(f'All data for Replay {gameId} of player {userId} has been sent. Closing websocket.')
    elif gameType == 'Playing':
        userId = int(await websocket.recv())

        model = keras.models.load_model(f'user_{userId}.h5')
        model.load_weights(f"user_{userId}_weights.hdf5")
        inputs = np.loadtxt(f'user_{userId}.csv', delimiter=',', dtype=int)
        while True:
            ## Retrieve the board state
            gameState = await websocket.recv()
            tokens = gameState.split(',')
            userId = int(tokens[0])
            gameId = int(tokens[1])
            ticks = int(tokens[2])
            if ticks < 0:
                print(f'The AI of player {userId} has lost game {gameId}. Closing websocket.')
                break

            boardData = np.zeros((HEIGHT, WIDTH))

            idx = 0
            for row in range(HEIGHT):
                for col in range(WIDTH):
                    boardData[row, col] = (tokens[3+row*WIDTH+col] != '0')
                    idx += 1

            currentData = encode_letter(tokens[223])
            idx += 1

            nextData = encode_letter(tokens[224])
            idx += 1

            timeData = np.array([int(tokens[225])])
            idx += 1

            bagData = np.zeros((1,7))
            startIdx = 226
            for i in range(7):
                bagData[0,i] = int(tokens[startIdx + i])

            minVal = min(bagData)
            bagData = bagData - minVal

            lines = int(tokens[233])
            score = int(tokens[234])

            boardData = boardData.reshape(-1, HEIGHT, WIDTH)
            pieceData = np.vstack([currentData,nextData]).T

            ## Feed the board state into our neural network
            idx = model.predict([boardData, bagData, pieceData, timeData])
            ## Choose strongest input
            # selected = np.argmax(idx)
            ## Add some uncertainty into the selection
            selected = np.argmin(abs(idx / max(idx) - np.random.uniform()))

            userInput = inputs[selected]

            ## Possibly visualize the neural network firing

            ## Send the input back to the game that requested it
            print(f'Sending predicted input of {userInput} for player {userId} for tick {ticks} of game {gameId}.')
            await websocket.send(f'{ticks},{userInput}')


print('Server online')

start_server = websockets.serve(updateDatabase, 'localhost', 8888)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
