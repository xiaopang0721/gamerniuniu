/**
* 牛牛
*/
module gameniuniu.page {
	export class NiuNiuPage extends game.gui.base.Page {
		private _viewUI: ui.nqp.game_ui.niuniu.QiangZhuangNN_HUDUI;
		private _difenTmep: any = [1, 10, 50, 100];
		private _leastTmep: any = [20, 200, 500, 1000];
		private _difenClipList: ClipUtil[] = [];
		private _leastClipList: ClipUtil[] = [];
		private _clipArr: any[] = [ClipUtil.HUD_FONT0, ClipUtil.HUD_FONT1, ClipUtil.HUD_FONT2, ClipUtil.HUD_FONT3];
		private _player: any;
		private _playerInfo: any;
		private _niuMgr: NiuMgr;
		private _isRoomcardType: boolean;

		constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
			super(v, onOpenFunc, onCloseFunc);
			this._asset = [
				Path_game_niuniu.atlas_game_ui + "niuniu.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "general.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "touxiang.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "logo.atlas",
				Path_game_niuniu.ui_niuniu + "sk/qznn_0.png",
				Path_game_niuniu.ui_niuniu + "sk/qznn_1.png",
				Path_game_niuniu.ui_niuniu + "sk/qznn_2.png",
				Path_game_niuniu.ui_niuniu + "sk/qznn_3.png",
			];
			this._isNeedDuang = false;
		}

		// 页面初始化函数
		protected init(): void {
			this._viewUI = this.createView('game_ui.niuniu.QiangZhuangNN_HUDUI', ["game_ui.tongyong.HudUI"]);
			this.addChild(this._viewUI);
			this._niuMgr = new NiuMgr(this._game);

			for (let index = 0; index < this._viewUI.box_right.numChildren; index++) {
				this._viewUI.box_right._childs[index].visible = false;
			}
			for (let index = 0; index < 4; index++) {
				if (!this._difenClipList[index]) {
					this._difenClipList[index] = new ClipUtil(this._clipArr[index]);
					this._difenClipList[index].x = this._viewUI["txt_difen" + index].x;
					this._difenClipList[index].y = this._viewUI["txt_difen" + index].y;
					this._viewUI["txt_difen" + index].parent && this._viewUI["txt_difen" + index].parent.addChild(this._difenClipList[index]);
					this._viewUI["txt_difen" + index].removeSelf();
				}
				if (!this._leastClipList[index]) {
					this._leastClipList[index] = new ClipUtil(this._clipArr[index]);
					this._leastClipList[index].x = this._viewUI["txt_least" + index].x;
					this._leastClipList[index].y = this._viewUI["txt_least" + index].y;
					this._leastClipList[index].scale(0.8, 0.8);
					this._viewUI["txt_least" + index].parent && this._viewUI["txt_least" + index].parent.addChild(this._leastClipList[index]);
					this._viewUI["txt_least" + index].removeSelf();
				}
			}
		}

		/**数据*/
		set dataSource(v: any) {
			this._dataSource = v;
			this._isRoomcardType = this._dataSource == PageDef.TYPE_CARD;
		}

		// 页面打开时执行函数
		protected onOpen(): void {
			super.onOpen();
			this.initRoomInfo();
			this.initRoomcardMode();
			this._viewUI.btn_xinshou.on(LEvent.CLICK, this, this.onBtnClickWithTween);
			this._viewUI.btn_chuji.on(LEvent.CLICK, this, this.onBtnClickWithTween);
			this._viewUI.btn_zhongji.on(LEvent.CLICK, this, this.onBtnClickWithTween);
			this._viewUI.btn_gaoji.on(LEvent.CLICK, this, this.onBtnClickWithTween);
			this._viewUI.btn_join.on(LEvent.CLICK, this, this.onBtnClickWithTween);

			(this._viewUI.view as TongyongHudNqpPage).onOpen(this._game, NiuniuPageDef.GAME_NAME, this._isRoomcardType);
			this._game.playMusic(Path_game_niuniu.music_niuniu + "nn_bgm.mp3");

			for (let index = 0; index < this._viewUI.box_right.numChildren; index++) {
				this._viewUI.box_right._childs[index].visible = true;
				Laya.Tween.from(this._viewUI.box_right._childs[index], {
					right: -300
				}, 200 + index * 100, Laya.Ease.linearNone);
			}
		}

		private initRoomInfo(): void {
			for (let index = 0; index < this._difenClipList.length; index++) {
				this._difenClipList[index].setText(this._difenTmep[index], true);
			}
			for (let index = 0; index < this._leastClipList.length; index++) {
				this._leastClipList[index].setText(this._leastTmep[index], true);
			}
		}

		/** 房卡模式下的布局 */
		private initRoomcardMode() {
			this._viewUI.box_normal.visible = !this._isRoomcardType;
		}

		protected onBtnTweenEnd(e: any, target: any): void {
			this._player = this._game.sceneObjectMgr.mainPlayer;
			if (!this._player) return;
			switch (target) {
				case this._viewUI.btn_xinshou:
					if (this._player.playerInfo.money < this._leastTmep[0]) {
						this.showTipsBox(this._leastTmep[0]);
						return;
					}
					this._game.sceneObjectMgr.intoStory(NiuniuPageDef.GAME_NAME, Web_operation_fields.GAME_ROOM_CONFIG_QIANGZHUANG_NIUNIU_1.toString());

					break;
				case this._viewUI.btn_chuji:
					if (this._player.playerInfo.money < this._leastTmep[1]) {
						this.showTipsBox(this._leastTmep[1]);
						return;
					}
					this._game.sceneObjectMgr.intoStory(NiuniuPageDef.GAME_NAME, Web_operation_fields.GAME_ROOM_CONFIG_QIANGZHUANG_NIUNIU_2.toString());//Web_operation_fields.game_room_config_table[7]
					break;
				case this._viewUI.btn_zhongji:
					if (this._player.playerInfo.money < this._leastTmep[2]) {
						this.showTipsBox(this._leastTmep[2]);
						return;
					}
					this._game.sceneObjectMgr.intoStory(NiuniuPageDef.GAME_NAME, Web_operation_fields.GAME_ROOM_CONFIG_QIANGZHUANG_NIUNIU_3.toString());
					break;
				case this._viewUI.btn_gaoji:
					if (this._player.playerInfo.money < this._leastTmep[3]) {
						this.showTipsBox(this._leastTmep[3]);
						return;
					}
					this._game.sceneObjectMgr.intoStory(NiuniuPageDef.GAME_NAME, Web_operation_fields.GAME_ROOM_CONFIG_QIANGZHUANG_NIUNIU_4.toString());
					break;
				case this._viewUI.btn_join:
					let maplv = TongyongUtil.getJoinMapLv(NiuniuPageDef.GAME_NAME, this._player.playerInfo.money);
					if (!maplv) {
						this.showTipsBox(this._leastTmep[0]);
						return;
					}
					this._game.sceneObjectMgr.intoStory(NiuniuPageDef.GAME_NAME, maplv.toString());
					break;
				default:
					break;
			}
		}

		private showTipsBox(limit: number) {
			this._game.alert(StringU.substitute("老板，您的金币少于{0}哦~\n补充点金币去大杀四方吧~", limit), () => {
				this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
			}, () => {
			}, true);
		}

		public close(): void {
			this._player = null;
			if (this._viewUI) {
				this._viewUI.btn_xinshou.off(LEvent.CLICK, this, this.onBtnClickWithTween);
				this._viewUI.btn_chuji.off(LEvent.CLICK, this, this.onBtnClickWithTween);
				this._viewUI.btn_zhongji.off(LEvent.CLICK, this, this.onBtnClickWithTween);
				this._viewUI.btn_gaoji.off(LEvent.CLICK, this, this.onBtnClickWithTween);
				this._viewUI.btn_join.off(LEvent.CLICK, this, this.onBtnClickWithTween);
				this._game.stopMusic();
			}
			super.close();
		}
	}
}