import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Bullet')
export class Bullet extends Component {
    @property
    speed: number = 200;

    start() {

    }

    update(deltaTime: number) {
        const p = this.node.getPosition();
        this.node.setPosition(p.x, p.y + this.speed * deltaTime, p.z);

        if (p.y > 440) {
            this.node.destroy();
        }
    }
}

