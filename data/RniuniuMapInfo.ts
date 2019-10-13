/**
* name 
*/
module gamerniuniu.data {
	export class RniuniuMapInfo extends gamecomponent.object.MapInfoT<RniuniuData> {
		//地图状态变更
		static EVENT_STATUS_CHECK: string = "RniuniuMapInfo.EVENT_STATUS_CHECK";
		//战斗体更新
		static EVENT_BATTLE_CHECK: string = "RniuniuMapInfo.EVENT_BATTLE_CHECK";
		//房卡局数更新
		static EVENT_GAME_ROUND_CHANGE: string = "RniuniuMapInfo.EVENT_GAME_ROUND_CHANGE";
		//牌局号
		static EVENT_GAME_NO: string = "RniuniuMapInfo.EVENT_GAME_NO";
		//倒计时时间戳更新
		static EVENT_COUNT_DOWN: string = "RniuniuMapInfo.EVENT_COUNT_DOWN";

		constructor(v: SceneObjectMgr) {
			super(v, () => { return new RniuniuData() });

		}

		//当对象更新发生时
		protected onUpdate(flags: number, mask: UpdateMask, strmask: UpdateMask): void {
			super.onUpdate(flags, mask, strmask);
			let isNew = flags & core.obj.OBJ_OPT_NEW;
			if (isNew || mask.GetBit(MapField.MAP_INT_MAP_BYTE)) {
				this._sceneObjectMgr.event(RniuniuMapInfo.EVENT_STATUS_CHECK);
			}
			if (isNew || mask.GetBit(MapField.MAP_INT_BATTLE_INDEX)) {
				this._battleInfoMgr.OnUpdate();
				this._sceneObjectMgr.event(RniuniuMapInfo.EVENT_BATTLE_CHECK);
			}
			if (isNew || mask.GetBit(MapField.MAP_INT_MAP_BYTE1)) {
				this._sceneObjectMgr.event(RniuniuMapInfo.EVENT_GAME_ROUND_CHANGE);
			}
			if (isNew || mask.GetBit(MapField.MAP_INT_COUNT_DOWN)) {
				this._sceneObjectMgr.event(RniuniuMapInfo.EVENT_COUNT_DOWN);
			}
			if (isNew || strmask.GetBit(MapField.MAP_STR_GAME_NO)) {
				this._sceneObjectMgr.event(RniuniuMapInfo.EVENT_GAME_NO);
			}
			if (isNew || mask.GetBit(MapField.MAP_INT_TOU_PIAO_TIME)) {
				this._sceneObjectMgr.event("TouPiaoMgr.EVENT_TOUPIAO_TIME");
			}
		}
		//牌型
		static CARDTYPE = ['没牛', '牛一', '牛二', '牛三', '牛四', '牛五', '牛六', '牛七', '牛八', '牛九', '牛牛', '四花牛', '五花牛', '四炸', '五小牛'];
		private _roundCount: number;//回合计数，方便房卡不同局分割开
		private _settleCount: number = 0;//结算计数，方便重置标识
		private _addRound: boolean = false;//回合标题已增加
		private _addBanker: boolean = false;//抢庄标题已增加
		private _addBet: boolean = false;//下注标题已增加
		private _addShowCards: boolean = false;//摊牌标题已增加
		private _addSettle: boolean = false;//结算标题已增加
		public getBattleInfoToObj(): any {
			let battleObj: any[] = [];
			this._roundCount = 1;
			for (let i = 0; i < this._battleInfoMgr.info.length; i++) {
				let info = this._battleInfoMgr.info[i] as gamecomponent.object.BattleInfoBase;
				let name = this.GetPlayerNameFromSeat(info.SeatIndex) + "：";
				if (!this._addRound) {//局数信息
					this._addRound = true;
					battleObj.push({ type: 1, title: StringU.substitute("第{0}局", this._roundCount) });
				}
				if (info instanceof gamecomponent.object.BattleInfoBanker) {//抢庄信息
					if (!this._addBanker) {
						this._addBanker = true;
						battleObj.push({ type: 2, title: "开始抢庄" });
					}
					let desc: string;
					if (info.BetVal == 0) {
						desc = name + " 不抢庄";
					} else {
						desc = name + " 抢庄" + HtmlFormat.addHtmlColor(info.BetVal.toString(), TeaStyle.COLOR_GREEN) + "倍";
					}
					battleObj.push({ type: 6, desc: desc });
				} else if (info instanceof gamecomponent.object.BattleInfoBetRate) {//庄家信息
					let desc: string = name + " 抢得" + HtmlFormat.addHtmlColor("[庄家]", TeaStyle.COLOR_GREEN);
					battleObj.push({ type: 6, desc: desc });
				} else if (info instanceof gamecomponent.object.BattleInfoBet) {//下注信息
					if (!this._addBet) {
						this._addBet = true;
						battleObj.push({ type: 2, title: "开始下注" });
					}
					let desc: string = name + " 下注" + HtmlFormat.addHtmlColor(info.BetVal.toString(), TeaStyle.COLOR_GREEN) + "倍";
					battleObj.push({ type: 6, desc: desc });
				} else if (info instanceof gamecomponent.object.BattleInfoPlayCard) {//摊牌信息
					if (!this._addShowCards) {
						this._addShowCards = true;
						battleObj.push({ type: 2, title: "开始摊牌" });
					}
					let desc: string = "[" + RniuniuMapInfo.CARDTYPE[info.CardType - 1] + "]";
					let isniu: boolean = info.CardType - 1 > 0;
					let cards = this.sortCardsToNiu(info.Cards);
					let newcards = [];
					for (let j: number = 0; j < info.Cards.length; j++) {
						newcards.push(info.Cards[j].GetVal());
					}
					battleObj.push({ type: 4, name: name, desc: desc, cards: newcards, isniu: isniu });
				} else if (info instanceof gamecomponent.object.BattleInfoSettle) {//结算信息
					if (!this._addSettle) {
						this._addSettle = true;
						battleObj.push({ type: 2, title: "开始结算" });
					}
					let desc: string = "";
					if (info.SettleVal > 0) {
						desc = name + " 积分 " + HtmlFormat.addHtmlColor("+" + info.SettleVal.toString(), TeaStyle.COLOR_GREEN)
					} else if (info.SettleVal < 0) {
						desc = name + " 积分 " + HtmlFormat.addHtmlColor(info.SettleVal.toString(), TeaStyle.COLOR_RED)
					} else {
						desc = name + " 积分 +" + info.SettleVal;
					}
					battleObj.push({ type: 6, desc: desc });
					this._settleCount++;
					if (this._settleCount == this.GetPlayerNumFromSeat()) {
						this._roundCount++;//下一回合计数
						this._addRound = false;
						this._addBanker = false;
						this._addBet = false;
						this._addShowCards = false;
						this._addSettle = false;
						this._settleCount = 0;
					}
				}
			}
			return battleObj;
		}

		//通过座位取玩家名字
		private GetPlayerNameFromSeat(index: number): string {
			let name: string;
			let users = this._battleInfoMgr.users;
			name = users[index - 1].name;
			return name
		}

		//遍历座位获取玩家总数
		private GetPlayerNumFromSeat(): number {
			let num: number = 0;
			for (let i = 0; i < this._battleInfoMgr.users.length; i++) {
				let user = this._battleInfoMgr.users[i];
				if (user.name) num++;
			}
			return num
		}

		//把牌整理成牛牌顺序
		sortCardsToNiu(cards): Array<RniuniuData> {
			let lave = 0; //余数
			let index1 = 0;
			let index2 = 0;
			let newCards = cards;
			for (let i: number = 0; i < newCards.length; i++) {
				lave = lave + newCards[i].GetCount();
			}
			lave = lave % 10;
			for (let i: number = 0; i < newCards.length - 1; i++) {
				for (let j: number = i + 1; j < newCards.length; j++) {
					if ((newCards[i].GetCount() + newCards[j].GetCount()) % 10 == lave) {
						index1 = i;
						index2 = j;
					}
				}
			}
			if (index1 + index2 == 0) return newCards;
			if (index1 < 3 && index2 < 3) {
				let a = newCards[3];
				newCards[3] = newCards[index1];
				newCards[index1] = a;
				a = newCards[4];
				newCards[4] = newCards[index2];
				newCards[index2] = a;
			}
			if (index1 < 3 && index2 >= 3) {
				let index = 0;
				if (index2 == 3) {
					index = 4;
				}
				else if (index2 == 4) {
					index = 3;
				}
				let a = newCards[index];
				newCards[index] = newCards[index1];
				newCards[index1] = a;
			}
			if (index2 < 3 && index1 >= 3) {
				let index = 0;
				if (index1 == 3) {
					index = 4;
				}
				else if (index1 == 4) {
					index = 3;
				}
				let a = newCards[index];
				newCards[index] = newCards[index2];
				newCards[index2] = a;
			}

			return newCards;
		}
	}
}