import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StartGame')
export class StartGame extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }

    onStartButtonClick () {
        director.loadScene('Game-Scene');
    }
}

