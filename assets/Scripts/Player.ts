import { _decorator, Component, EventTouch, Input, input, instantiate, Node, Prefab, Animation, Collider2D, Contact2DType, UIOpacity, Label } from 'cc';
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
    @property(Label)
    lifeLabel: Label = null;                             // 生命值文本：编辑器里把 Canvas/LifeLabel 拖到此槽位

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

        // 初始化生命值显示（文本节点由编辑器创建，这里只负责刷新内容）
        // 优先使用编辑器里拖拽绑定的引用；未绑定时按路径兜底查找 Canvas/LifeLabel
        if (!this.lifeLabel) {
            this.lifeLabel = this.node.parent?.getChildByName('LifeLabel')?.getComponent(Label) ?? null;
        }
        if (!this.lifeLabel) {
            console.warn('[Player] 未找到 LifeLabel，生命值文本不会显示');
        }
        this.refreshLifeLabel();
    }

    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        // 节点销毁时清理无敌相关的定时回调，避免回调访问已销毁的对象
        this.unschedule(this.blinkTick);
        this.unschedule(this.endInvincible);
        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
        // 玩家销毁时一并销毁生命值文本，避免留在界面上显示旧数据
        this.lifeLabel?.node.destroy();
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: any) {
        // 无敌期间直接忽略本次碰撞：不扣血、不播放受击动画
        if (this.isInvincible) {
            return;
        }

        this.liftCount -= 1;
        // 扣血后立即刷新界面上的生命值显示
        this.refreshLifeLabel();

        if (this.liftCount <= 0) {
            console.log('Player is dead');
            this.playerBodyAnimation?.play('Player_Down');

            // 死亡时先结束无敌闪烁，保证机体透明度恢复正常再播放死亡动画
            this.stopInvincible();

            if (this.collider) {
                this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }

            // 延迟 0.8 秒显示失败弹窗：先让 Player_Down 动画播完，再盖住屏幕
            // 弹窗节点由编辑器搭建（Canvas/GameOverPanel），这里只切换它的显隐
            this.scheduleOnce(() => {
                const panel = this.node.parent?.getChildByName('GameOverPanel');
                if (panel) {
                    panel.active = true;
                } else {
                    console.warn('[Player] 未找到 Canvas/GameOverPanel 节点');
                }
            }, 0.8);

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

    /**
     * 刷新生命值文本：受击扣血后调用，显示当前剩余生命
     */
    private refreshLifeLabel(): void {
        if (!this.lifeLabel) {
            return;
        }
        // 生命值可能扣到 0 以下，界面统一显示不小于 0 的数字
        this.lifeLabel.string = `生命: ${Math.max(this.liftCount, 0)}`;
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

