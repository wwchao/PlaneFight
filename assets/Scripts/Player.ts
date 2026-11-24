import { _decorator, Component, EventTouch, Input, input, instantiate, Node, Prefab, Animation, Collider2D, Contact2DType, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

enum ShootType {
    OneShoot,
    TwoShoot,
}

@ccclass('Player')
export class Player extends Component {
    @property(Node)
    playerBody: Node = null;   // 玩家机体
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
    @property
    liftCount: number = 3;   // 玩家生命值
    @property
    invincibleDuration: number = 2;   // 受击后的无敌持续时间（秒）
    @property
    blinkInterval: number = 0.08;     // 无敌期间机体闪烁的切换间隔（秒）

    private shootTimer: number = 0;     // 内部计时器
    shootType: ShootType = ShootType.OneShoot;
    playerBodyAnimation: Animation = null;
    collider: Collider2D = null;
    private isInvincible: boolean = false;               // 当前是否处于无敌状态（true 时忽略一切碰撞伤害）
    private playerBodyOpacity: UIOpacity = null;         // 机体透明度组件，用于实现无敌闪烁效果

    protected onLoad(): void {
        this.playerBodyAnimation = this.playerBody.getComponent(Animation);

        // 机体上没有 UIOpacity 组件时，运行时动态补一个，用于无敌期间闪烁
        this.playerBodyOpacity = this.playerBody.getComponent(UIOpacity);
        if (!this.playerBodyOpacity) {
            this.playerBodyOpacity = this.playerBody.addComponent(UIOpacity);
        }

        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);

        this.collider = this.getComponent(Collider2D);
        this.collider?.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        // 节点销毁时清理无敌相关的定时回调，避免回调访问已销毁的对象
        this.unschedule(this.blinkTick);
        this.unschedule(this.endInvincible);
        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: any) {
        // 无敌期间直接忽略本次碰撞：不扣血、不播放受击动画
        if (this.isInvincible) {
            return;
        }

        this.liftCount -= 1;

        if (this.liftCount <= 0) {
            console.log('Player is dead');
            this.playerBodyAnimation?.play('Player_Down');

            // 死亡时先结束无敌闪烁，保证机体透明度恢复正常再播放死亡动画
            this.stopInvincible();

            if (this.collider) {
                this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }

            this.scheduleOnce(() => {
                this.node.destroy();
            }, 1);
        } else {
            console.log('Player hit, remaining lives: ' + this.liftCount);
            this.playerBodyAnimation?.play('Player_Hit');

            // 受击后进入无敌时间，避免与敌人重叠时瞬间掉光全部生命
            this.startInvincible();
        }
    }

    /**
     * 开启无敌状态：
     * 1. 标记无敌，后续碰撞伤害在 onBeginContact 入口被拦截；
     * 2. 让机体按 blinkInterval 间隔切换透明度形成闪烁提示；
     * 3. invincibleDuration 秒后自动结束。
     */
    private startInvincible(): void {
        if (this.isInvincible) {
            return;
        }
        this.isInvincible = true;

        // 固定间隔切换机体透明度（闪烁）
        this.schedule(this.blinkTick, this.blinkInterval);
        // 到达无敌时长后自动结束
        this.scheduleOnce(this.endInvincible, this.invincibleDuration);
    }

    /**
     * 闪烁的一帧：在完全不透明(255)与半透明(60)之间来回切换
     */
    private blinkTick(): void {
        if (!this.playerBodyOpacity) {
            return;
        }
        this.playerBodyOpacity.opacity = this.playerBodyOpacity.opacity === 255 ? 60 : 255;
    }

    /**
     * 无敌时间结束的回调：由 scheduleOnce 在 invincibleDuration 秒后触发
     */
    private endInvincible(): void {
        this.stopInvincible();
    }

    /**
     * 停止无敌：恢复机体透明度并清理所有无敌相关的定时器
     */
    private stopInvincible(): void {
        this.isInvincible = false;
        this.unschedule(this.blinkTick);
        this.unschedule(this.endInvincible);
        if (this.playerBodyOpacity) {
            this.playerBodyOpacity.opacity = 255;
        }
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

