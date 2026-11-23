import { _decorator, Component, Node, Animation, Collider2D, Contact2DType } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    @property
    speed: number = 300;
    anim: Animation | null = null;
    @property
    hp: number = 1;
    collider: Collider2D | null = null;

    protected onLoad(): void {
        this.anim = this.getComponent(Animation);

        this.collider = this.getComponent(Collider2D);
        this.collider?.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: any) {
        this.hp -= 1;

        otherCollider.node.destroy();

        if (this.hp <= 0) {
            this.anim?.play('Enemy_Down');

            if (this.collider) {
                this.collider.enabled = false;

                this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }

            this.scheduleOnce(() => {
                this.node.destroy();
            }, 1);
        } else {
            console.log('Enemy hit, remaining HP: ' + this.hp);
            this.anim?.play('Enemy_Hit');
        }
    }

    protected onDestroy() {
        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    start() {
        // this.anim?.play('Enemy0_down');
    }

    update(deltaTime: number) {
        const p = this.node.getPosition();
        this.node.setPosition(p.x, p.y - this.speed * deltaTime, p.z);

        if (this.node.getPosition().y < -580) {
            this.node.destroy();
        }
    }
}

