/**
* name 
*/
module gamerniuniu.manager {
	const enum CARD_TYPE {
		NOT_NIU = 0, //没牛
		NIU_1 = 1, //牛一
		NIU_2 = 2, //牛二
		NIU_3 = 3, //牛三
		NIU_4 = 4, //牛四
		NIU_5 = 5, //牛五
		NIU_6 = 6, //牛六
		NIU_7 = 7, //牛七
		NIU_8 = 8, //牛八
		NIU_9 = 9, //牛九
		NIU_NIU = 10, //牛牛
		SILVER_NIU = 11, //银牛
		GOLD_NIU = 12, //金牛
		BOMB = 13, //炸弹
		SMALL_NIU = 14, //五小牛
	}
	const enum MULTIPLE {
		RATE_1 = 1, //没牛——牛六	1倍
		RATE_2 = 2, //牛七——牛八	2倍
		RATE_3 = 3, //牛九		  3倍
		RATE_4 = 4, //牛牛，四花牛   4倍
		RATE_5 = 5, //五花牛，炸弹   5倍
		RATE_6 = 6, //五小牛		  6倍
	}
	export class RniuniuMgr extends gamecomponent.managers.PlayingCardMgrBase<RniuniuData>{
		static readonly MAPINFO_OFFLINE: string = "NiuMgr.MAPINFO_OFFLINE";//假精灵
		static readonly DEAL_OVER: string = "NiuMgr.DEAL_OVER";//发牌结束
		static readonly WXSHARE_TITLE: string = "抢庄牛牛]房号:{0}";	// 分享标题
		static readonly WXSHARE_DESC: string = "开好房喽,就等你们一起来玩抢庄牛牛啦!晚了位置就没了哟~";	// 分享内容

		static readonly MIN_CARD_SEATS_COUNT: number = 2; // 房卡模式下最小人数
		static readonly MAX_NUM: number = 5;//最大人数

		private _bankerIndex: number;//庄家位置
		private _unitIndexOnTable: Array<number>;//精灵位置
		private _offlineUnit: UnitOffline;//假精灵信息
		private _isShowOver: boolean = false;
		private _isReKaiPai: boolean = true;
		private _isReconnect: boolean = true;
		private _totalUnitCount: number = 5;	// 玩家数量

		constructor(game: Game) {
			super(game)
		}

		get offlineUnit() {
			return this._offlineUnit;
		}

		set offlineUnit(v) {
			this._offlineUnit = v;
			this.event(RniuniuMgr.MAPINFO_OFFLINE)
		}

		get isReconnect() {
			return this._isReconnect;
		}

		set isReconnect(v) {
			this._isReconnect = v;
		}

		get isReKaiPai() {
			return this._isReKaiPai;
		}

		set isReKaiPai(v) {
			this._isReKaiPai = v;
		}

		get isShowOver() {
			return this._isShowOver;
		}

		set isShowOver(v) {
			this._isShowOver = v;
		}

		get totalUnitCount() {
			return this._totalUnitCount;
		}

		set totalUnitCount(v: number) {
			this._totalUnitCount = v;
		}

		//对牌进行排序
		SortCards(cards: any[]) {
			if (!cards) return;
			cards.sort((a: RniuniuData, b: RniuniuData) => {
				return a.Compare(b, true);
			});
		}

		// 根据牌获取牌型
		// 获得牛数
		private getNiubyCards(cards): number {
			let lave: number = 0; //余数
			for (let i = 0; i < cards.length; i++) {
				lave = lave + cards[i].GetCount();
			}
			lave = lave % 10;
			for (let i = 0; i < cards.length - 1; i++) {
				for (let j = i + 1; j < cards.length; j++) {
					if ((cards[i].GetCount() + cards[j].GetCount()) % 10 == lave) {
						if (lave == 0) {
							return 10;
						} else {
							return lave;
						}
					}
				}
			}
			return 0;
		}

		public checkCardsRate(cardtype): number {
			let cardRate = MULTIPLE.RATE_1;
			if (cardtype == 14) {
				cardRate = MULTIPLE.RATE_6;
				return cardRate;
			}
			if (cardtype == 12 || cardtype == 13) {
				cardRate = MULTIPLE.RATE_5;
				return cardRate;
			}
			if (cardtype == 10 || cardtype == 11) {
				cardRate = MULTIPLE.RATE_4;
				return cardRate;
			}
			if (cardtype == 9) {
				cardRate = MULTIPLE.RATE_3;
				return cardRate;
			}
			if (cardtype > 6 && cardtype < 9) {
				cardRate = MULTIPLE.RATE_2;
				return cardRate;
			}
			return cardRate;
		}

		public checkCardsType(cards): number {
			this.SortCards(cards);
			let cardtype = CARD_TYPE.NOT_NIU;
			if (this.is_small_niu(cards)) {
				cardtype = CARD_TYPE.SMALL_NIU;
				return cardtype
			}
			else if (this.is_bomb(cards)) {
				cardtype = CARD_TYPE.BOMB;
				return cardtype
			}
			else if (this.is_gold_niu(cards)) {
				cardtype = CARD_TYPE.GOLD_NIU;
				return cardtype
			}
			else if (this.is_silver_niu(cards)) {
				cardtype = CARD_TYPE.SILVER_NIU;
				return cardtype
			}
			cardtype = this.getNiubyCards(cards)
			return cardtype;
		}
		// 是否五小牛
		private is_small_niu(cards): boolean {
			let sum = 0;
			for (let i = 0; i < cards.length; i++) {
				sum = sum + cards[i].GetCount();
			}
			if (sum <= 10)
				return true
			else
				return false
		}
		// 是否炸弹
		private is_bomb(cards): boolean {
			if (cards[0].GetCardVal() == cards[3].GetCardVal())
				return true;
			else if (cards[1].GetCardVal() == cards[4].GetCardVal())
				return true;
			else
				return false;
		}
		// 是否五花牛
		private is_gold_niu(cards): boolean {
			if (cards[4].GetCardVal() > 10)
				return true;
			else
				return false;
		}
		// 是否四花牛
		private is_silver_niu(cards): boolean {
			if (cards[3].GetCardVal() > 10 && cards[4].GetCardVal() == 10)
				return true;
			else
				return false;
		}

		// 自己的牌型
		checkMyCards(): number {
			let cards = [];
			let type = 0;
			for (let i: number = 0; i < 5; i++) {
				cards.push(this._cards[i]);
			}
			type = this.checkCardsType(cards);
			return type;
		}

		sort() {
			let cards = this._cards;//牌堆
			let idx = this._game.sceneObjectMgr.mainUnit.GetIndex();
			let max = 5;
			let mainUnit: Unit = this._game.sceneObjectMgr.mainUnit;
			let count = 0;
			for (let index = 0; index < max; index++) {//ui座位
				let posIdx = (idx + index) % max == 0 ? max : (idx + index) % max;
				let unit = this._game.sceneObjectMgr.getUnitByIdx(posIdx);
				if (unit) {
					for (let i = 0; i < max; i++) {//手牌
						let card = cards[count * max + i] as RniuniuData;
						if (card) {
							card.myOwner(posIdx, mainUnit == unit, mainUnit.GetIndex());
							card.index = i;
							card.sortScore = max - i;
						}
					}
					count++;
				}
			}
		}

		setValue(infos: any, bankerIndex: number) {
			if (!this._cards.length) return;
			if (this._isShowOver) return;
			let mainUnit: Unit = this._game.sceneObjectMgr.mainUnit;
			if (!mainUnit || !mainUnit.GetIndex()) return;
			let cards = this._cards;//牌堆
			let idx = mainUnit.GetIndex();
			let max = 5;
			let count = 0;
			this._unitIndexOnTable = [];
			this._bankerIndex = bankerIndex;
			for (let index = 0; index < max; index++) {//ui座位
				let posIdx = (idx + index) % max == 0 ? max : (idx + index) % max;
				let unit = this._game.sceneObjectMgr.getUnitByIdx(posIdx);
				if (unit) {
					this._unitIndexOnTable.push(index);
					for (let i = 0; i < infos.length; i++) {
						if (unit.GetIndex() == infos[i].SeatIndex) {
							let _cardsInfo = infos[i].Cards;
							let _cards = [];
							for (let k: number = 0; k < _cardsInfo.length; k++) {
								_cards.push(_cardsInfo[k]);//用新数组存下来，方便调整牌序
							}
							let isNiu = this.checkCardsType(_cards);
							_cards = this.sortCardsToNiu(_cards);
							for (let j = 0; j < max; j++) {//手牌
								let card = cards[count * max + j] as RniuniuData;
								let _card = _cards[j];
								if (card) {
									card.Init(_card.GetVal());
									card.index = j;
									card.sortScore = max - j;
									if (isNiu && j > 2) {
										if (!card.targe_pos) {
											card.targe_pos = new Vector2();
										}
										card.isFinalPos = false;
										card.targe_pos.y = card.targe_pos.y - 20;
									}
								}
							}
							count++;
						}
					}
				}
			}
			this.kaipai();
			this.moveCard();
			this._isShowOver = true;
		}

		resetValue(infos: any, bankerIndex: number) {
			if (!this._cards.length) return;
			if (this._isShowOver) return;
			let mainUnit: Unit = this._game.sceneObjectMgr.mainUnit;
			if (!mainUnit || !mainUnit.GetIndex()) return;
			if (!this._cards.length) return;
			let cards = this._cards;//牌堆
			let idx = mainUnit.GetIndex();
			let max = 5;
			let count = 0;
			this._unitIndexOnTable = [];
			this._bankerIndex = bankerIndex;
			for (let index = 0; index < max; index++) {//ui座位
				let posIdx = (idx + index) % max == 0 ? max : (idx + index) % max;
				let unit = this._game.sceneObjectMgr.getUnitByIdx(posIdx);
				if (unit) {
					this._unitIndexOnTable.push(index);
					for (let i = 0; i < infos.length; i++) {
						if (unit.GetIndex() == infos[i].SeatIndex) {
							let _cardsInfo = infos[i].Cards;
							let _cards = [];
							for (let k: number = 0; k < _cardsInfo.length; k++) {
								_cards.push(_cardsInfo[k]);//用新数组存下来，方便调整牌序
							}
							let isNiu = this.checkCardsType(_cards);
							_cards = this.sortCardsToNiu(_cards);
							for (let j = 0; j < max; j++) {//手牌
								let card = cards[count * max + j] as RniuniuData;
								let _card = _cards[j];
								card.Init(_card.GetVal());
								card.index = j;
								card.sortScore = max - j;
								if (isNiu && j > 2) {
									if (!card.targe_pos) {
										card.targe_pos = new Vector2();
									}
									card.isFinalPos = false;
									card.targe_pos.y = card.targe_pos.y - 20;
								}
							}
							count++;
						}
					}
				}
			}
			this.rekaipai();
			this.removeCard();
			this._isShowOver = true;
		}

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

		//发牌
		fapai() {
			let count = 0;
			let counter = 0;
			for (let j: number = 0; j < 5; j++) {
				for (let i: number = 0; i < this._cards.length / 5; i++) {
					Laya.timer.once(150 * count, this, () => {
						this._game.playSound(PathGameTongyong.music_tongyong + "fapai.mp3", false);
						let card = this._cards[i * 5 + j];
						if (!card) return;
						card.fapai();
						counter++;
						if (counter >= this._cards.length) {
							this.event(RniuniuMgr.DEAL_OVER);
						}
					});
					count++;
				}
			}
		}

		//断线重连，重新发牌(主玩家大牌)
		refapai() {
			for (let i: number = 0; i < this._cards.length; i++) {
				let card = this._cards[i];
				if (!card) return;
				card.refapai();
			}
		}

		//断线重连，重新发牌(主玩家小牌)
		regaipai() {
			for (let i: number = 0; i < this._cards.length; i++) {
				let card = this._cards[i];
				if (!card) return;
				card.regaipai();
			}
		}

		//可以点了
		setToggleEnable() {
			for (let i: number = 0; i < 5; i++) {
				let card = this._cards[i];
				if (!card) return;
				card.toggleEnable = true;
			}
		}

		//盖牌
		gaipai() {
			for (let i: number = 0; i < 5; i++) {
				let card = this._cards[i];
				if (!card) return;
				card.toggleDistance = 0;
				card.yipai();
				card.gaipai();
			}
		}

		//翻牌
		fanpai() {
			Laya.timer.once(150 * this._cards.length, this, () => {
				for (let i: number = 0; i < 5; i++) {
					let card = this._cards[i];
					if (!card) return;
					card.fanpai();
				}
			});
		}

		//翻牌(断线重连后)
		reloadFanpai() {
			let count = 0;
			for (let i: number = 0; i < this._cards.length; i++) {
				let card = this._cards[i];
				if (!card) return;
				card.fanpai();
			}

		}

		//开牌
		kaipai() {
			//获取庄家下一家的逻辑位置，即为第一个开牌的位置
			let begin = this._unitIndexOnTable.indexOf(this._bankerIndex) + 1;
			let len = this._unitIndexOnTable.length;
			begin = begin >= len ? 0 : begin;
			let cardLen = this._cards.length / 5;
			for (let i = 0; i < cardLen; i++) {
				let index = begin + i >= cardLen ? begin + i - cardLen : begin + i;

				Laya.timer.once(500 + i * 1000, this, () => {
					for (let j = 0; j < 5; j++) {
						let card = this._cards[5 * index + j];
						if (!card) return;
						card.fanpai();
					}
				})
			}
		}

		//断线重连开牌
		rekaipai() {
			for (let i = 0; i < this._cards.length; i++) {
				let card = this._cards[i];
				if (!card) return;
				card.kaipai();
			}
		}

		//牛牌最后两张向下移动
		moveCard() {
			//获取庄家下一家的逻辑位置，即为第一个开牌的位置
			let begin = this._unitIndexOnTable.indexOf(this._bankerIndex) + 1;
			let len = this._unitIndexOnTable.length;
			begin = begin >= len ? 0 : begin;
			let cardLen = this._cards.length / 5;
			for (let i = 0; i < cardLen; i++) {
				let index = begin + i >= cardLen ? begin + i - cardLen : begin + i;

				Laya.timer.once(500 + i * 1000, this, () => {
					for (let j = 0; j < 5; j++) {
						let card = this._cards[5 * index + j];
						if (!card) return;
						card.moveCard();
					}
				})
			}
		}

		//牛牌最后两张向下移动（断线重连）
		removeCard() {
			//获取庄家下一家的逻辑位置，即为第一个开牌的位置
			let begin = this._unitIndexOnTable.indexOf(this._bankerIndex) + 1;
			let len = this._unitIndexOnTable.length;
			begin = begin >= len ? 0 : begin;
			let cardLen = this._cards.length / 5;
			for (let i = 0; i < cardLen; i++) {
				let index = begin + i >= cardLen ? begin + i - cardLen : begin + i;
				for (let j = 0; j < 5; j++) {
					let card = this._cards[5 * index + j];
					if (!card) return;
					card.moveCard();
				}
			}
		}

		// 清理指定玩家卡牌对象
		clearCardObject(index: number): void {
			this._game.sceneObjectMgr.ForEachObject((obj: any) => {
				if (obj instanceof RniuniuData) {
					if (obj.GetOwnerIdx() == index) {
						this._game.sceneObjectMgr.clearOfflineObject(obj);
					}
				}
			})
		}
	}
}