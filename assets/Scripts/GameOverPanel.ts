import { _decorator, Component, Button, director } from 'cc';
const { ccclass } = _decorator;

/**
 * 失败弹窗控制脚本
 * UI（背景图 + 重新开始按钮）由编辑器搭建在 GameOverPanel 节点下，
 * 脚本只负责监听按钮点击并重新加载场景，不参与任何节点创建。
 * 玩家生命值耗尽时，由 Player 把 GameOverPanel 节点设为 active = true。
 */
@ccclass('GameOverPanel')
export class GameOverPanel extends Component {
    private restartButton: Button = null;   // 重新开始按钮（编辑器里 GameOverPanel/RestartButton）

    protected onLoad(): void {
        // 节点默认隐藏，被 Player 激活后才会执行 onLoad
        // UI 节点由编辑器创建，这里按名字取到按钮并绑定点击事件
        const buttonNode = this.node.getChildByName('RestartButton');
        this.restartButton = buttonNode ? buttonNode.getComponent(Button) : null;
        if (!this.restartButton) {
            console.warn('[GameOverPanel] 未找到 RestartButton 或 Button 组件');
            return;
        }
        this.restartButton.node.on(Button.EventType.CLICK, this.onRestartClick, this);
    }

    protected onDestroy(): void {
        this.restartButton?.node.off(Button.EventType.CLICK, this.onRestartClick, this);
    }

    /** 点击"重新开始"：重新加载当前场景，恢复到初始状态 */
    private onRestartClick(): void {
        const sceneName = director.getScene()?.name;
        if (!sceneName) {
            console.warn('[GameOverPanel] 获取当前场景名失败，无法重新开始');
            return;
        }
        director.loadScene(sceneName);
    }
}
