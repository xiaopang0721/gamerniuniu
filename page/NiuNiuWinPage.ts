/**
* name 
*/
module gamerniuniu.page {
	export class NiuNiuWinPage extends game.gui.base.Page {
		private _viewUI: ui.nqp.game_ui.rniuniu.JieSuan_1UI;

		constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
			super(v, onOpenFunc, onCloseFunc);
			this._asset = [
				Path_game_rniuniu.atlas_game_ui + "niuniu.atlas",
			];
		}

		// 页面初始化函数
		protected init(): void {
			this._viewUI = this.createView('game_ui.niuniu.JieSuan_1UI');
			this.addChild(this._viewUI);
		}

		// 页面打开时执行函数
		protected onOpen(): void {
			super.onOpen();
			this._viewUI.ani1.on(LEvent.COMPLETE, this, this.onPlayComplte);
			this._viewUI.ani1.play(0, false);
		}

		private onPlayComplte(): void {
			Laya.timer.once(1000, this, () => {
				this.close();
			})
		}

		public close(): void {
			if (this._viewUI) {
				this._viewUI.ani1.off(LEvent.COMPLETE, this, this.onPlayComplte);
			}
			Laya.timer.clearAll(this);
			super.close();
		}
	}
}