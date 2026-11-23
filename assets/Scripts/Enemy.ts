import { _decorator, Component, Node, Animation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    @property
    speed: number = 300;

    protected onLoad(): void {
        console.log('===', this.getComponent(Animation));
    }

    start() {

    }

    update(deltaTime: number) {
        const p = this.node.getPosition();
        this.node.setPosition(p.x, p.y - this.speed * deltaTime, p.z);
    }
}

