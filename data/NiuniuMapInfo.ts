/**
* name 
*/
module gameniuniu.data {
	export class NiuniuMapInfo extends gamecomponent.object.MapInfoT<NiuData> {
		//地图状态变更
		static EVENT_STATUS_CHECK: string = "NiuniuMapInfo.EVENT_STATUS_CHECK";
		//战斗体更新
		static EVENT_BATTLE_CHECK: string = "NiuniuMapInfo.EVENT_BATTLE_CHECK";
		//房卡局数更新
		static EVENT_GAME_ROUND_CHANGE: string = "NiuniuMapInfo.EVENT_GAME_ROUND_CHANGE";
		//牌局号
		static EVENT_GAME_NO: string = "NiuniuMapInfo.EVENT_GAME_NO";
		//倒计时时间戳更新
		static EVENT_COUNT_DOWN: string = "NiuniuMapInfo.EVENT_COUNT_DOWN";

		constructor(v: SceneObjectMgr) {
			super(v, () => { return new NiuData() });

		}

		//当对象更新发生时
		protected onUpdate(flags: number, mask: UpdateMask, strmask: UpdateMask): void {
			super.onUpdate(flags, mask, strmask);
			let isNew = flags & core.obj.OBJ_OPT_NEW;
			if (isNew || mask.GetBit(MapField.MAP_INT_MAP_BYTE)) {
				this._sceneObjectMgr.event(NiuniuMapInfo.EVENT_STATUS_CHECK);
			}
			if (isNew || mask.GetBit(MapField.MAP_INT_BATTLE_INDEX)) {
				this._battleInfoMgr.OnUpdate();
				this._sceneObjectMgr.event(NiuniuMapInfo.EVENT_BATTLE_CHECK);
			}
			if (isNew || mask.GetBit(MapField.MAP_INT_MAP_BYTE1)) {
				this._sceneObjectMgr.event(NiuniuMapInfo.EVENT_GAME_ROUND_CHANGE);
			}
			if (isNew || mask.GetBit(MapField.MAP_INT_COUNT_DOWN)) {
				this._sceneObjectMgr.event(NiuniuMapInfo.EVENT_COUNT_DOWN);
			}
			if (isNew || strmask.GetBit(MapField.MAP_STR_GAME_NO)) {
				this._sceneObjectMgr.event(NiuniuMapInfo.EVENT_GAME_NO);
			}
		}
		//牌型
		static cardType = ['没牛', '牛一', '牛二', '牛三', '牛四', '牛五', '牛六', '牛七', '牛八', '牛九', '牛牛', '四花牛', '五花牛', '四炸', '五小牛']
		private _settleCount: number = 0;//结算计数，方便房卡不同局分割开
		public getBattleInfoToString(): string {
			let str: string = "";
			for (let i = 0; i < this._battleInfoMgr.info.length; i++) {
				let battleInfo = this._battleInfoMgr.info[i] as gamecomponent.object.BattleInfoBase;
				let name = this.GetPlayerNameFromSeat(battleInfo.SeatIndex)
				if (battleInfo.Type == 12) {
					let info = this._battleInfoMgr.info[i] as gamecomponent.object.BattleInfoBanker;
					let newString: string;
					if (info.BetVal == 0) {
						newString = name + "：" + "不抢庄";
					} else {
						newString = name + "：" + "抢庄" + info.BetVal + "倍";
					}
					if (str == "") {
						str = newString;
					} else {
						str = str + "#" + newString;
					}
				} else if (battleInfo.Type == 13) {
					let info = this._battleInfoMgr.info[i] as gamecomponent.object.BattleInfoBetRate;
					let newString = "庄家是：" + name;
					str = str + "#" + newString;
				} else if (battleInfo.Type == 2) {
					let info = this._battleInfoMgr.info[i] as gamecomponent.object.BattleInfoBet;
					let newString = name + "：" + "下注" + info.BetVal + "倍";
					str = str + "#" + newString;
				} else if (battleInfo.Type == 3) {
					let info = this._battleInfoMgr.info[i] as gamecomponent.object.BattleInfoPlayCard<gamecomponent.object.PlayingPuKeCard>;
					let newString = name + "：" + "摊牌，牌型是：" + NiuniuMapInfo.cardType[info.CardType - 1];
					str = str + "#" + newString;
				} else if (battleInfo.Type == 11) {
					let info = this._battleInfoMgr.info[i] as gamecomponent.object.BattleInfoSettle;
					let newString = name + "盈利：" + info.SettleVal;
					this._settleCount++;
					str = str + "#" + newString;
					if (this._settleCount == this.GetPlayerNumFromSeat()) {
						str = str + "#";
						this._settleCount = 0;
					}
				}
			}
			return str;
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
	}
}