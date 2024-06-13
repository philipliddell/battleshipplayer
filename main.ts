// Player

const playerid = ""+randint(0, 99999);

type StateName = "discovery" | "waiting" | "turn" | "win" | "loss"
interface GameState {
    name: StateName;
    onMessage: (messageType: string, id: string, data: string) => void;
    onUpdate: () => void;
    onA?: () => void;
    onB?: () => void;
    onAB?: () => void;
}

interface GameData {
    currentState: GameState | undefined;
    shipCoord: { x: number, y: number };
    selectedCoord: { x: number, y: number; };
    firedCoords: { x: number, y: number; }[];
}

const messagePrefix = "BS"

const gameData: GameData = {
    currentState: undefined,
    shipCoord: {
        x: randint(0, 4),
        y: randint(0, 4)
    },
    selectedCoord: {
        x: 2,
        y: 2
    },
    firedCoords: []
}

const stateMap = {} as any;

const winState: GameState = {
    name: "win",
    onMessage: (messageType, id, data) => {
        
    },
    onUpdate: () => {
        basic.showIcon(IconNames.Diamond);
    },
    onAB: () => {
        gameData.firedCoords = [];
        gameData.selectedCoord = { x: 2, y: 2 }
        gameData.currentState = stateMap["discovery"]
    }
}
stateMap[winState.name] = winState;

const loseState: GameState = {
    name: "loss",
    onMessage: (messageType, id, data) => {

    },
    onUpdate: () => {
        basic.showIcon(IconNames.Skull);
    },
    onAB: () => {
        gameData.firedCoords = [];
        gameData.selectedCoord = { x: 2, y: 2 }
        gameData.currentState = stateMap["discovery"]
    }
}
stateMap[loseState.name] = loseState;

const turnState: GameState = {
    name: "turn",
    onMessage: (messageType, id, data) => {
        
    },
    onUpdate: () => {
        basic.clearScreen();
        for (const coord of gameData.firedCoords) {
            led.plot(coord.x, coord.y);
        }
        led.plot(gameData.selectedCoord.x, gameData.selectedCoord.y);
    },
    onA: () => {
        let nextX = gameData.selectedCoord.x + 1;
        if (nextX > 4) {
            nextX = 0;
        }

        gameData.selectedCoord.x = nextX;
    },
    onB: () => {
        let nextY = gameData.selectedCoord.y + 1;
        if (nextY > 4) {
            nextY = 0;
        }

        gameData.selectedCoord.y = nextY;
    },
    onAB: () => {
        gameData.firedCoords.push({x: gameData.selectedCoord.x, y: gameData.selectedCoord.y});
        radio.sendString(messagePrefix + "F" + playerid + ":" + gameData.selectedCoord.x + "" + gameData.selectedCoord.y);
        gameData.currentState = stateMap["waiting"];
    }
}
stateMap[turnState.name] = turnState;

const waitingState: GameState = {
    name: "waiting",
    onMessage: (messageType, id, data) => {
        if (messageType === "T" && id === playerid) {
            gameData.currentState = stateMap["turn"];
        }
        if (messageType === "E") {
            if (data === playerid) {
                gameData.currentState = stateMap["win"]
            }
            else {
                gameData.currentState = stateMap["loss"]
            }
        }
    },
    onUpdate: () => {
        basic.showIcon(IconNames.Sword);
    }
}
stateMap[waitingState.name] = waitingState;

const discoveryState: GameState = {
    name: "discovery",
    onMessage: (messageType, id, data) => {
        if (messageType === "J" && id === playerid) {
            gameData.currentState = stateMap["waiting"];
        }
    },
    onUpdate: () => {
        basic.showIcon(IconNames.Target);
        radio.sendString(messagePrefix + "D" + playerid + ":" + gameData.shipCoord.x + "" + gameData.shipCoord.y)
    }
}
stateMap[discoveryState.name] = discoveryState;

radio.onReceivedString(str => {
    if (str.substr(0, 2) !== messagePrefix) {
        return;
    }

    console.log(str)

    const withoutPrefix = str.substr(2);
    const messageType = withoutPrefix.charAt(0);
    const split = withoutPrefix.substr(1).split(":");
    const id = split[0];
    const data = split[1];

    gameData.currentState.onMessage(messageType, id, data);
})

gameData.currentState = discoveryState

basic.forever(function () {
	gameData.currentState.onUpdate();
})

input.onButtonPressed(Button.A, () => {
    if (gameData.currentState.onA) {
        gameData.currentState.onA();
    }
})

input.onButtonPressed(Button.B, () => {
    if (gameData.currentState.onB) {
        gameData.currentState.onB();
    }
})

input.onButtonPressed(Button.AB, () => {
    if (gameData.currentState.onAB) {
        gameData.currentState.onAB();
    }
})
