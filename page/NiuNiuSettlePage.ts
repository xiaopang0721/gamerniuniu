/**
* name 
*/
module gameniuniu.page {
	export class NiuNiuSettlePage extends game.gui.base.Page {
		private _viewUI: ui.nqp.game_ui.niuniu.JieSuanUI;
		private _niuMgr: NiuMgr;
		private _niuStory: NiuniuCardRoomStory;

		constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
			super(v, onOpenFunc, onCloseFunc);
			this._isNeedBlack = true;
			this._isClickBlack = false;
			this._asset = [
				PathGameTongyong.atlas_game_ui_tongyong+ "general.atlas",
			];
		}

		// 页面初始化函数
		protected init(): void {
			this._viewUI = this.createView('game_ui.niuniu.JieSuanUI');
			this.addChild(this._viewUI);
			this._niuStory = this._game.sceneObjectMgr.story as NiuniuCardRoomStory;
			this._niuMgr = this._niuStory.niuMgr;
		}

		// 页面打开时执行函数
		protected onOpen(): void {
			super.onOpen();
			this._viewUI.list_settle.vScrollBarSkin = "";
			this._viewUI.list_settle.scrollBar.elasticDistance = 100;
			this._viewUI.list_settle.itemRender = this.createChildren("game_ui.niuniu.component.JieSuanCardRenderUI", ListRecordItem);
			this._viewUI.list_settle.renderHandler = new Handler(this, this.renderHandler);

			this._viewUI.list_settle.dataSource = this.dataSource[3];
			this._endTime = this.dataSource[2];
			this._viewUI.lab_xinxi.visible = this.dataSource[0];
			this._viewUI.btn_create_room.visible = false;
			this._viewUI.btn_back_hud.visible = false;
			this._viewUI.btn_create_room.visible = this.dataSource[0] == this.dataSource[1];
			this._viewUI.btn_back_hud.visible = this.dataSource[0] == this.dataSource[1];
			this._viewUI.btn_create_room.on(LEvent.CLICK, this, this.onBtnClickWithTween);
			this._viewUI.btn_back_hud.on(LEvent.CLICK, this, this.onBtnClickWithTween);
		}

		//按钮点击
		protected onBtnTweenEnd(e: LEvent, target: any) {
			switch (target) {
				case this._viewUI.btn_create_room:
					this._game.uiRoot.general.open(NiuniuPageDef.PAGE_NIUNIU_CREATE_CARDROOM);
					this.close();
					break;
				case this._viewUI.btn_back_hud:
					this._game.sceneObjectMgr.leaveStory(true);
					this.close();
					break;
			}
		}

		private renderHandler(cell: ListRecordItem, index: number) {
			if (cell) {
				cell.setData(this._game, cell.dataSource);
			}
		}

		//倒计时
		private _endTime: number;
		deltaUpdate(): void {
			if (!this._viewUI) return;
			let curTime = this._game.sync.serverTimeBys;
			let time = Math.floor(this._endTime - curTime) + 1;
			if (time > 0) {
				let str = time + "s后开始第" + (this.dataSource[0] + 1) + "局，本轮共" + this.dataSource[1] + "局";
				this._viewUI.lab_xinxi.text = str;
			} else {
				if (!this._viewUI.btn_create_room.visible) {
					this.close();
				} else {
					let str = "游戏结束，本轮共" + this.dataSource[1] + "局";
					this._viewUI.lab_xinxi.text = str;
				}
			}
		}

		public close(): void {
			this._viewUI.btn_create_room.off(LEvent.CLICK, this, this.onBtnClickWithTween);
			this._viewUI.btn_back_hud.off(LEvent.CLICK, this, this.onBtnClickWithTween);

			super.close();
		}
	}

	class ListRecordItem extends ui.nqp.game_ui.niuniu.component.JieSuanCardRenderUI {
		private _game: Game;
		private _data: any;
		setData(game: Game, data: any) {
			this._game = game;
			this._data = data;
			this.img_bg.visible = this._data.isMain;
			this.img_banker.visible = this._data.isbanker;
			this.lab_name.text = this._data.name;
			this.lab_difen.text = this._data.difen.toString();
			this.lab_betRate.text = this._data.betRate;
			this.lab_bankerRate.text = this._data.bankerRate;
			this.lab_jifen.text = this._data.jiFen.toString();
			this.lab_totalJiFen.text = this._data.totalJiFen.toString();
			this.lab_cardtype.text = this._data.cardtype;
			this.lab_name.color = this._data.isMain ? TeaStyle.COLOR_JIESUAN : TeaStyle.COLOR_WHITE;
			this.lab_difen.color = this._data.isMain ? TeaStyle.COLOR_JIESUAN : TeaStyle.COLOR_WHITE;
			this.lab_betRate.color = this._data.isMain ? TeaStyle.COLOR_JIESUAN : TeaStyle.COLOR_WHITE;
			this.lab_jifen.color = parseFloat(this._data.jiFen) >= 0 ? TeaStyle.COLOR_GREEN : TeaStyle.COLOR_RED;
			this.lab_totalJiFen.color = parseFloat(this._data.totalJiFen) >= 0 ? TeaStyle.COLOR_GREEN : TeaStyle.COLOR_RED;
			this.lab_bankerRate.color = this._data.isMain ? TeaStyle.COLOR_JIESUAN : TeaStyle.COLOR_WHITE;
			this.lab_cardtype.color = this._data.isMain ? TeaStyle.COLOR_JIESUAN : TeaStyle.COLOR_WHITE;
		}

		destroy() {
			super.destroy();
		}
	}
}