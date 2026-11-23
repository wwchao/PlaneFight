import { _decorator, Component, EventTouch, Input, input, instantiate, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

enum ShootType {
    OneShoot,
    TwoShoot,
}

@ccclass('Player')
export class Player extends Component {
    @property(Prefab)
    bullet1Prefab: Prefab = null;   // 子弹1号
    @property(Node)
    bulletParent: Node = null;  // 所有子弹盒子
    @property(Node)
    bullet1Position: Node = null;   // 子弹发射位置
    @property(Node)
    bullet2Position001: Node = null;   // 双子弹发射位置
    @property(Node)
    bullet2Position002: Node = null;   // 双子弹发射位置
    @property
    bulletInterval: number = 0.2;   // 发射间隔（秒），0.2 即每秒 5 发
    private shootTimer: number = 0;     // 内部计时器

    shootType: ShootType = ShootType.OneShoot;

    protected onLoad(): void {
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    onTouchMove (event: EventTouch) {
        const p = this.node.getPosition();

        this.node.setPosition(p.x + event.getDeltaX(), p.y + event.getDeltaY(), p.z);
    }

    start() {

    }

    update(deltaTime: number) {
        this.shootTimer += deltaTime;

        if (this.shootTimer >= this.bulletInterval) {
            this.shootTimer = 0;
            switch (this.shootType) {
                case ShootType.OneShoot:
                    this.oneShoot();
                    break;
                case ShootType.TwoShoot:
                    this.twoShoot();
                    break;
            }
        }
    }

    oneShoot () {
        const bullet1 = instantiate(this.bullet1Prefab);
        bullet1.setParent(this.bulletParent);
        bullet1.setWorldPosition(this.bullet1Position.getWorldPosition());
    }

    twoShoot () {
        const bullet1 = instantiate(this.bullet1Prefab);
        const bullet2 = instantiate(this.bullet1Prefab);
        bullet1.setParent(this.bulletParent);
        bullet2.setParent(this.bulletParent);
        bullet1.setWorldPosition(this.bullet2Position001.getWorldPosition());
        bullet2.setWorldPosition(this.bullet2Position002.getWorldPosition());
    }
}

