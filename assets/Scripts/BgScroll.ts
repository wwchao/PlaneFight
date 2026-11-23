import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BgScroll')
export class BgScroll extends Component {
    @property(Node)
    bg01: Node = null;
    @property(Node)
    bg02: Node = null;

    @property
    speed: number = 100;

    start() {

    }

    update(deltaTime: number) {
        let position01 = this.bg01.getPosition();
        this.bg01.setPosition(position01.x, position01.y - this.speed * deltaTime, position01.z);
        let position02 = this.bg02.getPosition();
        this.bg02.setPosition(position02.x, position02.y - this.speed * deltaTime, position02.z);

        position01 = this.bg01.getPosition();
        position02 = this.bg02.getPosition();

        if (this.bg01.position.y < -852) {
            this.bg01.setPosition(position02.x, position02.y + 852, position02.z);
        }
        if (this.bg02.position.y < -852) {
            this.bg02.setPosition(position01.x, position01.y + 852, position01.z);
        }
    }
}

