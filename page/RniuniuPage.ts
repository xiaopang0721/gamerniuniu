/**
* 牛牛
*/
module gamerniuniu.page {
	export class RniuniuPage extends game.gui.base.Page {
		private _viewUI: ui.nqp.game_ui.rniuniu.QiangZhuangNN_HUDUI;
		private _player: any;
		private _playerInfo: any;
		private _niuMgr: RniuniuMgr;

		constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
			super(v, onOpenFunc, onCloseFunc);
			this._asset = [
				Path_game_rniuniu.atlas_game_ui + "rniuniu.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "general.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "touxiang.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "logo.atlas",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_0.png",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_1.png",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_2.png",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_3.png",
			];
			this._isNeedDuang = false;
		}

		// 页面初始化函数
		protected init(): void {
			this._viewUI = this.createView('game_ui.rniuniu.QiangZhuangNN_HUDUI', ["game_ui.tongyong.HudUI"]);
			this.addChild(this._viewUI);
			this._niuMgr = new RniuniuMgr(this._game);
		}

		// 页面打开时执行函数
		protected onOpen(): void {
			super.onOpen();
			this._viewUI.img_room_create.on(LEvent.CLICK, this, this.onBtnClickWithTween);
			this._viewUI.img_room_join.on(LEvent.CLICK, this, this.onBtnClickWithTween);

			(this._viewUI.view as TongyongHudNqpPage).onOpen(this._game, RniuniuPageDef.GAME_NAME, true);
			this._game.playMusic(Path_game_rniuniu.music_niuniu + "nn_bgm.mp3");

			for (let index = 0; index < this._viewUI.box_roomcard.numChildren; index++) {
				this._viewUI.box_roomcard._childs[index].visible = true;
				Laya.Tween.from(this._viewUI.box_roomcard._childs[index], {
					right: -300
				}, 200 + index * 100, Laya.Ease.linearNone);
			}
		}

		protected onBtnTweenEnd(e: any, target: any): void {
			this._player = this._game.sceneObjectMgr.mainPlayer;
			if (!this._player) return;
			switch (target) {
				case this._viewUI.img_room_create:
					this._game.uiRoot.general.open(RniuniuPageDef.PAGE_NIUNIU_CREATE_CARDROOM);
					break;
				case this._viewUI.img_room_join:
					this._game.uiRoot.general.open(RniuniuPageDef.PAGE_NIUNIU_JOIN_CARDROOM);
					break;
				default:
					break;
			}
		}

		public close(): void {
			this._player = null;
			if (this._viewUI) {
				this._viewUI.img_room_create.off(LEvent.CLICK, this, this.onBtnClickWithTween);
				this._viewUI.img_room_join.off(LEvent.CLICK, this, this.onBtnClickWithTween);
				this._game.stopMusic();
			}
			super.close();
		}
	}
}