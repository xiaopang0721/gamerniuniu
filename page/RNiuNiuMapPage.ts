/**
* 牛牛
*/
module gamerniuniu.page {
    const enum MAP_STATUS {
        PLAY_STATUS_GAME_NONE = 0, // 初始化
        PLAY_STATUS_CARDROOM_CREATED = 1, //房间创建后
        PLAY_STATUS_CARDROOM_WAIT = 2, //房卡等人中
        PLAY_STATUS_GAME_SHUFFLE = 3, // 洗牌阶段
        PLAY_STATUS_GAME_START = 4, // 游戏开始
        PLAY_STATUS_GET_BANKER = 5, // 开始抢庄
        PLAY_STATUS_SET_BANKER = 6, // 定庄阶段
        PLAY_STATUS_BET = 7, // 下注阶段
        PLAY_STATUS_PUSH_CARD = 8, // 发牌阶段
        PLAY_STATUS_MATCH_POINT = 9, // 配牛阶段
        PLAY_STATUS_COMPARE = 10, // 比牌阶段
        PLAY_STATUS_SETTLE = 11, // 结算阶段
        PLAY_STATUS_SETTLE_INFO = 12, // 显示结算信息
        PLAY_STATUS_SHOW_GAME = 13, // 本局展示阶段
    }
    const MONEY_NUM = 50; // 特效金币数量
    const MONEY_FLY_TIME = 30; // 金币飞行时间间隔

    // 房间底注和限入配置
    const ROOM_CONFIG = {
        "191": [1, 0],    //房卡
    };
    const CARD_TYPE = ["没牛", "牛一", "牛二", "牛三", "牛四", "牛五", "牛六", "牛七", "牛八", "牛九", "牛牛", "四花牛", "五花牛", "炸弹", "五小牛"];    //牌型
    export class RNiuNiuMapPage extends game.gui.base.Page {
        private _viewUI: ui.nqp.game_ui.rniuniu.QiangZhuangNNUI;
        private _kuangView: ui.nqp.game_ui.tongyong.effect.SuiJiUI;//随机庄家框特效
        private _niuMgr: RniuniuMgr;//牛牛管理器
        private _niuStory: any;//牛牛剧情类
        private _niuMapInfo: RniuniuMapInfo;//牛牛地图信息类
        private _bankerList: Array<number> = [];//抢庄倍率集合
        private _betList: Array<number> = [];//下注倍率集合
        private _playerList: any = [];//精灵UI集合
        private _unitIndexOnTable: Array<number> = [];//精灵位置集合
        private _bankerWinInfo: Array<number> = [];//庄家赢牌信息集合
        private _bankerLoseInfo: Array<number> = [];//庄家输牌信息集合
        private _bankerRateInfo: Array<Array<number>> = [];//抢最大同倍庄集合
        private _clipList: Array<RniuniuClip> = [];//飘字集合
        private _room_config: any = [];//房间等级底注信息
        private _bankerIndex: number;//庄家位置
        private _bankerBenefit: number;//庄家总收益
        private _mainPlayerBenefit: number;//玩家收益
        private _curStatus: number;//当前地图状态
        private _countDown: number;//倒计时时间戳
        private _isPlayXiPai: boolean = false;//播放洗牌
        private _getBankerCount: number = 0;//抢庄日志计数
        private _toupiaoMgr: TouPiaoMgr;//投票解散管理器
        private _toupiaoSuccess: boolean = false;//投票成功
        // 房卡系列
        private _totalPoint: Array<number> = [0, 0, 0, 0, 0];  // 当前玩家累计积分 分别是座位号-积分值 
        private _isPlaying: boolean = false;    //是否进行中
        private _isGameEnd: boolean = false;    //是否本局游戏结束

        constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
            super(v, onOpenFunc, onCloseFunc);
            this._isNeedDuang = false;
            this._delta = 1000;
            this._asset = [
                DatingPath.atlas_dating_ui + "qifu.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "pai.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "general.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "touxiang.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "qz.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "fk.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "chongzhi.atlas",
                Path_game_rniuniu.atlas_game_ui + "rniuniu.atlas",
                Path_game_rniuniu.atlas_game_ui + "rniuniu/qp.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "general/effect/suiji.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "general/effect/fapai_1.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "general/effect/xipai.atlas",
                Path_game_rniuniu.ui_niuniu + "sk/qznn_0.png",
                Path_game_rniuniu.ui_niuniu + "sk/qznn_1.png",
                Path_game_rniuniu.ui_niuniu + "sk/qznn_2.png",
                Path_game_rniuniu.ui_niuniu + "sk/qznn_3.png",
            ];
        }

        // 页面初始化函数
        protected init(): void {
            this._viewUI = this.createView('game_ui.rniuniu.QiangZhuangNNUI');
            this.addChild(this._viewUI);
            this.initView();
            if (!this._pageHandle) {
                this._pageHandle = PageHandle.Get("NiuNiuMapPage");//额外界面控制器
            }
            if (!this._niuMgr) {
                this._niuStory = this._game.sceneObjectMgr.story as RniuniuStory;
                this._niuMgr = this._niuStory.niuMgr;
                this._niuMgr.on(RniuniuMgr.DEAL_OVER, this, this.onUpdateAniDeal);
            }
            this._game.playMusic(Path_game_rniuniu.music_niuniu + "nn_bgm.mp3");
            this._viewUI.btn_spread.left = this._game.isFullScreen ? 30 : 10;
            this._viewUI.box_menu.left = this._game.isFullScreen ? 25 : 10;
        }

        // 页面打开时执行函数
        protected onOpen(): void {
            super.onOpen();
            this.initBeiClip();
            //是否断线重连
            this.onUpdateMapInfo()
            this.onUpdateUnitOffline();//初始化假的主玩家

            //所有监听
            this._viewUI.btn_spread.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_rule.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_chongzhi.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_set.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_bankerRate0.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_bankerRate1.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_bankerRate2.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_bankerRate3.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_betRate1.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_betRate2.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_betRate3.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_betRate4.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_tanpai.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_zhanji.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.view_card.btn_start.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.view_card.btn_invite.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_dismiss.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_qifu.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.box_xinshou.on(LEvent.CLICK, this, this.onBtnClickWithTween);

            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_OPRATE_SUCESS, this, this.onSucessHandler);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_UNIT_NAME_CHANGE, this, this.onUnitComing);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_ADD_UNIT, this, this.onUnitAdd);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_REMOVE_UNIT, this, this.onUnitRemove);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_UNIT_MONEY_CHANGE, this, this.onUpdateUnit);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_UNIT_CHANGE, this, this.onUpdateUnit);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_UNIT_ACTION, this, this.onUpdateUnit);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_UNIT_QIFU_TIME_CHANGE, this, this.onUpdateUnit);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_MAPINFO_CHANGE, this, this.onUpdateMapInfo);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_MAIN_UNIT_CHANGE, this, this.updateCardRoomDisplayInfo);

            this._game.sceneObjectMgr.on(RniuniuMapInfo.EVENT_STATUS_CHECK, this, this.onUpdateStatus);
            this._game.sceneObjectMgr.on(RniuniuMapInfo.EVENT_BATTLE_CHECK, this, this.onUpdateBattle);
            this._game.sceneObjectMgr.on(RniuniuMapInfo.EVENT_GAME_ROUND_CHANGE, this, this.onUpdateGameRound);
            this._game.sceneObjectMgr.on(RniuniuMapInfo.EVENT_GAME_NO, this, this.onUpdateGameNo);//牌局号
            this._game.sceneObjectMgr.on(RniuniuMapInfo.EVENT_COUNT_DOWN, this, this.onUpdateCountDown);//倒计时更新
            this._viewUI.xipai.ani_xipai.on(LEvent.COMPLETE, this, this.onWashCardOver);
            this._game.qifuMgr.on(QiFuMgr.QIFU_FLY, this, this.qifuFly);

            this._game.network.addHanlder(Protocols.SMSG_OPERATION_FAILED, this, this.onOptHandler);
            this._game.mainScene && this._game.mainScene.on(SceneOperator.AVATAR_MOUSE_CLICK_HIT, this, this.onUpdatePoint);
        }

        private _curDiffTime: number;
        update(diff: number) {
            super.update(diff);
            if (!this._curDiffTime || this._curDiffTime < 0) {
                this._viewUI.btn_chongzhi.ani1.play(0, false);
                this._curDiffTime = TongyongPageDef.CZ_PLAY_DIFF_TIME;
            } else {
                this._curDiffTime -= diff;
            }
            this._toupiaoMgr && this._toupiaoMgr.update(diff);
        }

        //倍数
        private _beiClip1: ClipUtil;
        private _beiClip2: ClipUtil;
        private _beiClip3: ClipUtil;
        private _beiClip4: ClipUtil;
        initBeiClip(): void {
            for (let i = 1; i < 5; i++) {
                this["_beiClip" + i] = new ClipUtil(ClipUtil.BEI_FONT);
                this["_beiClip" + i].centerX = this._viewUI["clip_betRate" + i].centerX;
                this["_beiClip" + i].centerY = this._viewUI["clip_betRate" + i].centerY;
                this._viewUI["clip_betRate" + i].parent.addChild(this["_beiClip" + i]);
                this._viewUI["clip_betRate" + i].visible = false;
            }
        }

        clearBeiClip(): void {
            for (let i = 1; i < 5; i++) {
                if (this["_beiClip" + i]) {
                    this["_beiClip" + i].removeSelf();
                    this["_beiClip" + i].destroy();
                    this["_beiClip" + i] = null;
                }
            }
        }

        //帧间隔心跳
        deltaUpdate() {
            if (!(this._niuMapInfo instanceof RniuniuMapInfo)) return;
            if (!this._viewUI) return;
            if (this._noTimer.indexOf(this._curStatus) != -1) {
                return;
            }
            let curTime = this._game.sync.serverTimeBys;
            let time = Math.floor(this._countDown - curTime);
            if (time > 0) {
                this._viewUI.box_timer.visible = true;
                this._viewUI.box_timer.txt_time.text = time.toString();
                switch (this._curStatus) {
                    case MAP_STATUS.PLAY_STATUS_GET_BANKER:// 开始抢庄
                        if (this._isDoBanker) return;
                        this._viewUI.box_bankerRate.visible = true;
                        break;
                    case MAP_STATUS.PLAY_STATUS_BET:// 下注阶段
                        if (this._isDoBet) return;
                        this._viewUI.box_betRate.visible = this._bankerIndex != 0;
                        break;
                    case MAP_STATUS.PLAY_STATUS_MATCH_POINT:// 配牛阶段
                        if (this._niuStory.isGaiPai) return;
                        this._viewUI.btn_tanpai.visible = true;
                        this._viewUI.box_matchPoint.visible = true;
                        break;
                }

            } else {
                this._viewUI.box_timer.visible = false;
            }
        }

        /******************************房卡专用****************************** */
        private updateCardRoomDisplayInfo() {
            if (!this._niuMapInfo) return;
            if (!this._game.sceneObjectMgr.mainUnit) return;
            this.onUpdateUnit();
            if (this._niuMapInfo.GetCardRoomId() && !this._isPlaying && !this._isGameEnd) {
                this.setCardRoomBtnVisible();
            }
        }

        // 房卡按纽及状态
        private setCardRoomBtnVisible() {
            if (this._isPlaying) return;
            let isRoomMaster: boolean = this._niuStory.isCardRoomMaster();
            this._viewUI.text_cardroomid.text = this._niuMapInfo.GetCardRoomId().toString();
            this._viewUI.view_card.btn_invite.visible = true;
            this._viewUI.view_card.btn_invite.centerX = isRoomMaster ? -200 : 0;
            this._viewUI.view_card.btn_start.visible = isRoomMaster;
            this._viewUI.btn_dismiss.skin = isRoomMaster ? PathGameTongyong.ui_tongyong_general + "btn_js.png" : PathGameTongyong.ui_tongyong_general + "btn_fh1.png";
            this._viewUI.btn_dismiss.tag = isRoomMaster ? 2 : 1;
            this._viewUI.box_tips.visible = !isRoomMaster;
            this._viewUI.txt_tips.text = "等待房主开始游戏...";
        }

        // 房卡模式解散游戏,是否需要房主限制
        private masterDismissCardGame() {
            let mainUnit: Unit = this._game.sceneObjectMgr.mainUnit;
            if (!mainUnit) return;
            if (this._isPlaying) {
                if (!this._toupiaoMgr) return;
                //是否成功解散了
                if (this._toupiaoMgr.touPiaoResult) {
                    this._game.showTips("解散投票通过，本局结束后房间解散");
                    return;
                }
                //是否在投票中
                if (this._toupiaoMgr.isTouPiaoing) {
                    this._game.showTips("已发起投票，请等待投票结果");
                    return;
                }
                //下次发起投票的时间
                let nextTime = Math.floor(this._niuMapInfo.GetTouPiaoTime() + 60 - this._game.sync.serverTimeBys);
                if (nextTime > 0) {
                    this._game.showTips(StringU.substitute("请在{0}s之后再发起投票", nextTime));
                    return;
                }
                //在游戏中 发起投票选项
                TongyongPageDef.ins.alertRecharge(StringU.substitute("牌局尚未结束，需发起投票，<span color='{0}'>{1}</span>方可解散。", TeaStyle.COLOR_GREEN, "全员同意"), () => {
                    //发起投票
                    this._game.network.call_rniuniu_vote(1);
                }, null, true, TongyongPageDef.TIPS_SKIN_STR["fqtq"], TongyongPageDef.TIPS_SKIN_STR["title_ts"]);
            } else {
                //不在游戏中
                if (!this._niuStory.isCardRoomMaster()) {
                    TongyongPageDef.ins.alertRecharge(StringU.substitute("只有房主才可以解散房间哦"), () => {
                    }, () => {
                    }, true, TongyongPageDef.TIPS_SKIN_STR["qd"]);
                } else {
                    if (!this._isGameEnd) {
                        TongyongPageDef.ins.alertRecharge("游戏未开始，解散不会扣除房费！\n是否解散房间？", () => {
                            this._niuStory.endRoomCardGame(mainUnit.GetIndex(), this._niuMapInfo.GetCardRoomId());
                            this._game.sceneObjectMgr.leaveStory();
                        }, null, true, TongyongPageDef.TIPS_SKIN_STR["js"], TongyongPageDef.TIPS_SKIN_STR["title_ts"], null, TongyongPageDef.TIPS_SKIN_STR["btn_red"]);
                    }
                }
            }
        }

        private getUnitCount() {
            let count: number = 0;
            let unitDic = this._game.sceneObjectMgr.unitDic;
            if (unitDic) {
                for (let key in unitDic) {
                    count++;
                }
            }
            return count;
        }

        private setCardGameStart() {
            let mainUnit: Unit = this._game.sceneObjectMgr.mainUnit;
            if (!mainUnit) return;
            let mapinfo: RniuniuMapInfo = this._game.sceneObjectMgr.mapInfo as RniuniuMapInfo;
            if (!mapinfo) return;
            if (mapinfo.GetPlayState()) return;
            if (mainUnit.GetRoomMaster() != 1) {
                TongyongPageDef.ins.alertRecharge(StringU.substitute("只有房主才可以选择开始游戏哦"), () => {
                }, () => {
                }, true);
                return;
            }
            if (this.getUnitCount() < RniuniuMgr.MIN_CARD_SEATS_COUNT) {
                TongyongPageDef.ins.alertRecharge(StringU.substitute("老板，再等等嘛，需要两个人才可以开始"), () => {
                }, () => {
                }, true);
                return;
            }
            this._niuStory.startRoomCardGame(mainUnit.guid, this._niuMapInfo.GetCardRoomId());
        }
        /******************************************************************** */

        //名字发生变化
        private onUnitComing(): void {
            for (let i = 0; i < this._unitPlayArr.length; i++) {
                let unitObj = this._unitPlayArr[i];
                let name = unitObj.unit.GetName();
                let unit: Unit = unitObj.unit;
                //欢迎进场,不能是自己,且没播过，且有名字
                if (this._game.sceneObjectMgr.mainUnit != unit && !unitObj.isPlay && name) {
                    this._game.showTips(StringU.substitute("欢迎{0}加入房间", HtmlFormat.addHtmlColor(name.toString(), TeaStyle.COLOR_WHITE)));
                    unitObj.isPlay = true;
                }
            }
        }

        //玩家进来了
        private _unitPlayArr: Array<any> = [];
        private onUnitAdd(u: Unit) {
            let obj = {
                unit: u,
                isPlay: false
            }
            this._unitPlayArr.push(obj);
            this.onUpdateUnit();
        }

        //玩家出去了
        private onUnitRemove(u: Unit) {
            this.onUpdateUnit();
            //离场清除桌上卡牌
            this._niuMgr.clearCardObject(u.GetIndex());
        }

        //更新发牌动画
        private onUpdateAniDeal(status: number): void {
            this._viewUI.paixie.ani2.gotoAndStop(0);
        }

        private onWashCardOver(): void {
            if (!this._isPlayXiPai) return;
            Laya.Tween.to(this._viewUI.xipai, { x: 1007, y: 165, alpha: 0, rotation: -30, scaleX: 0.35, scaleY: 0.35 }, 500);
            Laya.timer.once(500, this, () => {
                this._viewUI.paixie.cards.visible = true;
                this._viewUI.paixie.ani_chupai.play(0, false);
                this._isPlayXiPai = false;
            })
        }

        private onUpdateMapInfo(): void {
            let mapinfo = this._game.sceneObjectMgr.mapInfo;
            this._niuMapInfo = mapinfo as RniuniuMapInfo;
            if (mapinfo) {
                this.onUpdateStatus();
                this.resetBattleIdx();
                this.onUpdateUnit();
                this.onUpdateBattle();
                this.onUpdateCountDown();
                this.updateCardRoomDisplayInfo();
                if (this._curStatus > MAP_STATUS.PLAY_STATUS_GAME_NONE) {
                    this._viewUI.paixie.cards.visible = true;
                }
                if (this._niuStory.isReConnected) {
                    this._niuStory.mapLv = mapinfo.GetMapLevel();
                    this._isGameEnd = false;
                    this.onUpdateGameRound();
                }
            }
        }

        //还没有主玩家精灵数据，先用主玩家数据显示
        private onUpdateUnitOffline() {
            let mPlayer = this._game.sceneObjectMgr.mainPlayer;
            let mPlayerInfo = mPlayer.playerInfo;
            if (mPlayer && mPlayerInfo) {
                this._viewUI.view0.visible = true;
                this._viewUI.view0.view_icon.txt_name.text = getMainPlayerName(mPlayerInfo.nickname);
                this._viewUI.view0.view_icon.img_icon.skin = TongyongUtil.getHeadUrl(mPlayerInfo.headimg, 2);
                this._viewUI.view0.view_icon.img_qifu.visible = TongyongUtil.getIsHaveQiFu(mPlayer, this._game.sync.serverTimeBys);
                //头像框
                this._viewUI.view0.view_icon.img_txk.skin = TongyongUtil.getTouXiangKuangUrl(mPlayerInfo.headKuang, 2);
                this._viewUI.view0.view_icon.txt_money.text = EnumToString.getPointBackNum(mPlayerInfo.money, 2).toString();
            }
        }

        private onUpdateUnit(qifu_index?: number) {
            if (!this._niuMapInfo) return;
            let battleInfoMgr = this._niuMapInfo.battleInfoMgr;
            this._unitIndexOnTable = [];
            //主玩家的座位
            if (!this._game.sceneObjectMgr.mainUnit) return;
            let idx = this._game.sceneObjectMgr.mainUnit.GetIndex();
            for (let index = 0; index < RniuniuMgr.MAX_NUM; index++) {
                let posIdx = (idx + index) % RniuniuMgr.MAX_NUM == 0 ? RniuniuMgr.MAX_NUM : (idx + index) % RniuniuMgr.MAX_NUM;
                let unit = this._game.sceneObjectMgr.getUnitByIdx(posIdx);
                this._playerList[index].visible = unit;
                if (unit) {
                    this._unitIndexOnTable.push(index);
                    this._playerList[index].view_icon.txt_name.text = getMainPlayerName(unit.GetName());
                    if ((this._curStatus != MAP_STATUS.PLAY_STATUS_COMPARE && this._curStatus != MAP_STATUS.PLAY_STATUS_SETTLE) || this._niuStory.isReConnected) {
                        this.updateMoney();
                    }
                    if (unit.GetIdentity() == 1) {
                        this._bankerIndex = index;
                        if (this._niuStory.isReConnected && this._curStatus > MAP_STATUS.PLAY_STATUS_GET_BANKER && this._bankerRateList[index]) {
                            this._playerList[index].box_rate.visible = true;
                            this._playerList[index].box_rate.box_qiang.visible = true;
                            this._playerList[index].box_rate.box_buqiang.visible = false;
                            this._playerList[index].box_rate.box_bet.visible = false;
                            this._playerList[index].box_rate.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "qp/bei_{0}.png", this._bankerRateList[index]);
                            this._playerList[index].view_icon.img_banker.visible = true;
                            this._playerList[index].view_icon.img_banker.ani1.play(0, false);
                        }
                        if (unit.GetIndex() == idx)
                            this._viewUI.box_betRate.visible = false;
                    } else {
                        if (this._niuStory.isReConnected && this._curStatus > MAP_STATUS.PLAY_STATUS_GET_BANKER) {
                            this._playerList[index].box_rate.visible = false;
                        }
                    }
                    //头像框
                    this._playerList[index].view_icon.img_txk.skin = TongyongUtil.getTouXiangKuangUrl(unit.GetHeadKuangImg(), 2);

                    //祈福成功 头像上就有动画
                    if (qifu_index && posIdx == qifu_index) {
                        this._playerList[index].view_icon.qifu_type.visible = true;
                        this._playerList[index].view_icon.qifu_type.skin = this._qifuTypeImgUrl;
                        this.playTween(this._playerList[index].view_icon.qifu_type, qifu_index);
                    }
                    //时间戳变化 才加上祈福标志
                    if (TongyongUtil.getIsHaveQiFu(unit, this._game.sync.serverTimeBys)) {
                        if (qifu_index && posIdx == qifu_index) {
                            Laya.timer.once(2500, this, () => {
                                this._playerList[index].view_icon.img_qifu.visible = true;
                                this._playerList[index].view_icon.img_icon.skin = TongyongUtil.getHeadUrl(unit.GetHeadImg(), 2);
                            })
                        } else {
                            this._playerList[index].view_icon.img_qifu.visible = true;
                            this._playerList[index].view_icon.img_icon.skin = TongyongUtil.getHeadUrl(unit.GetHeadImg(), 2);
                        }
                    } else {
                        this._playerList[index].view_icon.img_qifu.visible = false;
                        this._playerList[index].view_icon.img_icon.skin = TongyongUtil.getHeadUrl(unit.GetHeadImg(), 2);
                    }
                }
            }
        }

        private _diff: number = 500;
        private _timeList: { [key: number]: number } = {};
        private _firstList: { [key: number]: number } = {};
        private playTween(img: LImage, index: number, isTween?: boolean) {
            if (!img) return;
            if (!this._timeList[index]) {
                this._timeList[index] = 0;
            }
            if (this._timeList[index] >= 2500) {
                this._timeList[index] = 0;
                this._firstList[index] = 0;
                img.visible = false;
                return;
            }
            Laya.Tween.to(img, { alpha: isTween ? 1 : 0.2 }, this._diff, Laya.Ease.linearNone, Handler.create(this, this.playTween, [img, index, !isTween]), this._firstList[index] ? this._diff : 0);
            this._timeList[index] += this._diff;
            this._firstList[index] = 1;
        }

        private updateMoney(): void {
            if (!this._game.sceneObjectMgr.mainUnit) return;
            let idx = this._game.sceneObjectMgr.mainUnit.GetIndex();
            for (let index = 0; index < RniuniuMgr.MAX_NUM; index++) {
                let posIdx = (idx + index) % RniuniuMgr.MAX_NUM == 0 ? RniuniuMgr.MAX_NUM : (idx + index) % RniuniuMgr.MAX_NUM;
                let unit = this._game.sceneObjectMgr.getUnitByIdx(posIdx);
                this._playerList[index].visible = unit;
                if (unit) {
                    let momey = EnumToString.getPointBackNum(unit.GetMoney(), 2).toString();
                    this._playerList[index].view_icon.txt_money.text = momey;
                }
            }
        }

        //庄家赢钱，部分闲家输钱  表现
        private addBankerWinEff(): void {
            if (!this._bankerWinInfo) return;
            if (this._bankerWinInfo.length == 2) {//庄家全输
                return;
            }
            this._game.playSound(Path_game_rniuniu.music_niuniu + "piaoqian.mp3", false);
            let bankerPos = this._bankerIndex;
            for (let i: number = 0; i < this._bankerWinInfo.length / 2; i++) {
                let index = i * 2;
                let unitPos = this.getUnitUIPos(this._bankerWinInfo[index]);
                let unitBenefit = this._bankerWinInfo[index + 1];
                if (unitPos == -1) continue;
                if (i < this._bankerWinInfo.length / 2 - 1) {
                    this.addMoneyFly(unitPos, bankerPos);
                    this.addMoneyClip(unitBenefit, unitPos);
                }
            }
            if (this._bankerBenefit >= 0) {
                this.addMoneyClip(this._bankerBenefit, bankerPos);
            }
        }

        //庄家输钱，部分闲家赢钱  表现
        private addBankerLoseEff(): void {
            if (!this._bankerLoseInfo) return;
            if (this._bankerLoseInfo.length == 2) {//庄家通杀
                return;
            }
            this._game.playSound(Path_game_rniuniu.music_niuniu + "piaoqian.mp3", false);
            let bankerPos = this._bankerIndex;
            for (let i: number = 0; i < this._bankerLoseInfo.length / 2; i++) {
                let index = i * 2;
                let unitPos = this.getUnitUIPos(this._bankerLoseInfo[index]);
                let unitBenefit = this._bankerLoseInfo[index + 1];
                if (unitPos == -1) continue;
                if (i < this._bankerLoseInfo.length / 2 - 1) {
                    this.addMoneyFly(bankerPos, unitPos);
                    this.addMoneyClip(unitBenefit, unitPos);
                }
            }
            if (this._bankerBenefit < 0) {
                this.addMoneyClip(this._bankerBenefit, bankerPos);
            }
        }

        //根据实际位置获取精灵在UI上的逻辑位置
        private getUnitUIPos(_index): number {
            //主玩家的座位
            let idx = this._game.sceneObjectMgr.mainUnit.GetIndex();
            for (let index = 0; index < RniuniuMgr.MAX_NUM; index++) {
                let posIdx = (idx + index) % RniuniuMgr.MAX_NUM == 0 ? RniuniuMgr.MAX_NUM : (idx + index) % RniuniuMgr.MAX_NUM;
                let unit = this._game.sceneObjectMgr.getUnitByIdx(posIdx)
                if (unit && posIdx == _index) {
                    return index;
                }
            }
            return -1;
        }

        private addKuangView(_info): void {
            this._bankerList = _info;
            this._viewUI.addChild(this._kuangView);
            this._kuangView.ani1.gotoAndStop(0)
            this._count = 0;
            Laya.timer.loop(this._diff_ran, this, this.ranEffPos);
            this.ranEffPos();
        }

        private _diff_ran: number = 200;
        private _count: number = 0;
        private _curIndex: number = 0;
        private ranEffPos(): void {
            if (!this._game.mainScene || !this._game.mainScene.camera) return;
            if (this._curIndex >= this._bankerList.length) {
                this._curIndex = 0;
            }
            let randIndex = this.getUnitUIPos(this._bankerList[this._curIndex]);
            let posX = this._game.mainScene.camera.getScenePxByCellX(this._playerList[randIndex].x + this._playerList[randIndex].view_icon.x - 26);
            let posY = this._game.mainScene.camera.getScenePxByCellY(this._playerList[randIndex].y + this._playerList[randIndex].view_icon.y - 23);
            this._kuangView.pos(posX, posY);
            this._game.playSound(Path_game_rniuniu.music_niuniu + "suiji.mp3", false);
            if (randIndex == this._bankerIndex) {
                if (this._count >= 2000) {
                    this._kuangView.ani1.play(0, false)
                    Laya.timer.once(1000, this, () => {
                        this._game.playSound(Path_game_rniuniu.music_niuniu + "suidao.mp3", false);
                        this._playerList[this._bankerIndex].view_icon.img_banker.visible = true;
                        this._playerList[this._bankerIndex].view_icon.img_banker.ani1.play(0, false);
                    })
                    Laya.timer.clear(this, this.ranEffPos);
                    return;
                }
            }
            this._curIndex++;
            this._count += this._diff_ran;
        }

        //下注倍数按钮更新
        private onUpdateBetBtn(a: number, b: number, c: number) {
            let bankerMoney = a;
            let playerMoney = this._game.sceneObjectMgr.mainPlayer.playerInfo.money;
            let bankerRate = b;
            let base = c;
            let maxBetRate = 15;
            this._betList = [1, 5, 10, 15];
            // this._viewUI.btn_betRate1.label = this._betList[0] + "倍";
            this._beiClip1.setText(this._betList[0], true);
            if (this._betList[1]) {
                // this._viewUI.btn_betRate2.label = this._betList[1] + "倍";
                this._beiClip2.setText(this._betList[1], true);
                this._viewUI.btn_betRate2.visible = true;
            } else {
                this._viewUI.btn_betRate2.visible = false;
            }
            if (this._betList[2]) {
                // this._viewUI.btn_betRate3.label = this._betList[2] + "倍";
                this._beiClip3.setText(this._betList[2], true);
                this._viewUI.btn_betRate3.visible = true;
            } else {
                this._viewUI.btn_betRate3.visible = false;
            }
            if (this._betList[3]) {
                // this._viewUI.btn_betRate4.label = this._betList[3] + "倍";
                this._beiClip4.setText(this._betList[3], true);
                this._viewUI.btn_betRate4.visible = true;
            } else {
                this._viewUI.btn_betRate4.visible = false;
            }
        }

        //配牛点数更新
        private onUpdatePoint(hitAvatar: any) {
            if (this._curStatus != MAP_STATUS.PLAY_STATUS_MATCH_POINT) {
                return;
            }
            if (hitAvatar.card.GetOwnerIdx() != this._game.sceneObjectMgr.mainUnit.GetIndex()) {
                return;
            }
            if (this._niuMgr.toggleCount() > 3) {//超过3张 不再顶起
                hitAvatar.card.toggle = false;
                return;
            }
            let cardCount = hitAvatar.card.GetCount();
            if (!hitAvatar.card._isTouch) {
                if (this._viewUI.txt_pointTotal.text) {
                    return;
                }
                this._game.playSound(Path_game_rniuniu.music_niuniu + "dianjipai.mp3", false);
                hitAvatar.card._isTouch = true;
                if (!this._viewUI.txt_point0.text) {
                    this._viewUI.txt_point0.text = cardCount.toString();
                } else if (!this._viewUI.txt_point1.text) {
                    this._viewUI.txt_point1.text = cardCount.toString();
                } else if (!this._viewUI.txt_point2.text) {
                    this._viewUI.txt_point2.text = cardCount.toString();
                }
                if (this._viewUI.txt_point0.text && this._viewUI.txt_point1.text && this._viewUI.txt_point2.text) {
                    let pointTotal = parseInt(this._viewUI.txt_point0.text) + parseInt(this._viewUI.txt_point1.text) + parseInt(this._viewUI.txt_point2.text);
                    if (pointTotal % 10 != 0) {//结果不符合
                        this._viewUI.txt_pointTotal.color = TeaStyle.COLOR_RED;
                        Laya.timer.once(5000, this, () => {
                            this._niuMgr.pinpaicuowu();//点出去的牌收回来
                            this._viewUI.txt_point0.text = "";
                            this._viewUI.txt_point1.text = "";
                            this._viewUI.txt_point2.text = "";
                            this._viewUI.txt_pointTotal.text = "";
                        })
                    } else {//结果符合
                        this._viewUI.txt_pointTotal.color = TeaStyle.COLOR_GREEN;
                    }
                    this._viewUI.txt_pointTotal.text = pointTotal.toString();
                }
            } else {
                hitAvatar.card._isTouch = false;
                this._viewUI.txt_pointTotal.text = "";
                for (let i: number = 0; i < 3; i++) {
                    if (parseInt(this._viewUI["txt_point" + i].text) == cardCount) {
                        this._viewUI["txt_point" + i].text = "";
                        break;
                    }
                }
            }
        }

        //重连之后，战斗日志从哪开始刷
        private resetBattleIdx(): void {
            if (!this._niuMapInfo) return;
            if (!this._niuStory.isReConnected) return;
            let battleInfoMgr = this._niuMapInfo.battleInfoMgr;
            for (let i = 0; i < battleInfoMgr.info.length; i++) {
                let battleInfo = battleInfoMgr.info[i] as gamecomponent.object.BattleInfoBase;
                let index: number = 0;
                if (battleInfo instanceof gamecomponent.object.BattleInfoBanker) {
                    index = i;
                }
                let index1: number = 0;
                if (battleInfo instanceof gamecomponent.object.BattleInfoSettle) {
                    index1 = i;
                }
                if (index < index1) {
                    this._battleIndex = index - 1;
                } else {
                    this._battleIndex = index1;
                }
            }
        }

        //战斗结构体更新
        private _battleIndex: number = -1;
        private onUpdateBattle() {
            if (!this._niuMapInfo) return;
            let battleInfoMgr = this._niuMapInfo.battleInfoMgr;
            if (!battleInfoMgr) return;
            for (let i = 0; i < battleInfoMgr.info.length; i++) {
                let battleInfo = battleInfoMgr.info[i] as gamecomponent.object.BattleInfoBase;
                if (battleInfo instanceof gamecomponent.object.BattleInfoBanker)  //抢庄
                {
                    if (this._battleIndex < i) {
                        this._battleIndex = i;
                        this._bankerRateInfo.push([battleInfo.SeatIndex, battleInfo.BetVal]);
                        this.onBattleBanker(battleInfo);
                        this._getBankerCount++;
                        if (this._getBankerCount == this.getUnitCount()) {
                            if (!this._niuStory.isReConnected)
                                this.setBanker();
                        }
                    }
                }
                else if (battleInfo instanceof gamecomponent.object.BattleInfoBetRate)  //定闲家下注倍数
                {
                    if (this._battleIndex < i) {
                        this._battleIndex = i;
                        this.onUpdateBetBtn(battleInfo.BankerMoney, battleInfo.BankerRate, battleInfo.Antes);
                    }
                }
                else if (battleInfo instanceof gamecomponent.object.BattleInfoBet) //下注
                {
                    if (this._battleIndex < i) {
                        this._battleIndex = i;
                        this.onBattleBet(battleInfo);
                    }
                }
                else if (battleInfo instanceof gamecomponent.object.BattleInfoPass)//拼牌
                {
                    if (this._battleIndex < i) {
                        this._battleIndex = i;
                        this.onBattlePinPai(battleInfo, this._niuMapInfo.GetMapState());
                    }
                }
                else if (battleInfo instanceof gamecomponent.object.BattleInfoPlayCard) //出牌
                {
                    if (this._battleIndex < i) {
                        this._battleIndex = i;
                        this.onBattlePlayCard(battleInfo);
                    }
                }
                else if (battleInfo instanceof gamecomponent.object.BattleInfoSettle)//结算
                {
                    if (this._battleIndex < i) {
                        this._battleIndex = i;
                        this.onBattleSettle(battleInfo);
                    }
                }
                else if (battleInfo instanceof gamecomponent.object.BattleInfoSponsorVote)//投票状态
                {
                    if (this._battleIndex < i) {
                        this._battleIndex = i;
                        this._toupiaoMgr && this._toupiaoMgr.onBattleUpdate(battleInfo);
                        if (battleInfo.tpResult == 1) this._toupiaoSuccess = true;
                    }
                }
                else if (battleInfo instanceof gamecomponent.object.BattleInfoVoting)//投票
                {
                    if (this._battleIndex < i) {
                        this._battleIndex = i;
                        this._toupiaoMgr && this._toupiaoMgr.onBattleUpdate(battleInfo);
                    }
                }
            }

        }

        private _bankerRate: number = 0;
        private setBanker(): void {
            let indexList = []
            let index = 1
            this._bankerRate = 0
            for (let i: number = 0; i < this._bankerRateInfo.length; i++) {
                if (this._bankerRateInfo[i][1] > this._bankerRate) {
                    this._bankerRate = this._bankerRateInfo[i][1];
                    indexList = [];
                    indexList.push(this._bankerRateInfo[i][0])
                } else if (this._bankerRateInfo[i][1] == this._bankerRate) {
                    indexList.push(this._bankerRateInfo[i][0])
                }
            }
            if (indexList.length == 1) {
                this._viewUI.addChild(this._kuangView);
                this._kuangView.ani1.play(0, false);
                let zhuangIndex = this.getUnitUIPos(indexList[0]);
                if (this._game.mainScene.camera) {
                    let posX = this._game.mainScene.camera.getScenePxByCellX(this._playerList[zhuangIndex].x + this._playerList[zhuangIndex].view_icon.x - 26);
                    let posY = this._game.mainScene.camera.getScenePxByCellY(this._playerList[zhuangIndex].y + this._playerList[zhuangIndex].view_icon.y - 23);
                    this._kuangView.pos(posX, posY);
                    Laya.timer.once(1000, this, () => {
                        this._game.playSound(Path_game_rniuniu.music_niuniu + "suidao.mp3", false);
                        this._playerList[zhuangIndex].view_icon.img_banker.visible = true;
                        this._playerList[zhuangIndex].view_icon.img_banker.ani1.play(0, false);
                    })
                }
            } else {
                this.addKuangView(indexList);
            }
        }

        private _bankerRateList: number[] = [];
        private onBattleBanker(info: any): void {
            let flag: boolean = info.BetVal > 0;
            let index = this.getUnitUIPos(info.SeatIndex);
            this._bankerRateList[index] = info.BetVal ? info.BetVal : 1;
            if (this._niuStory.isReConnected && this._curStatus > MAP_STATUS.PLAY_STATUS_GET_BANKER) {
                if (index == this._bankerIndex) {
                    this._playerList[index].box_rate.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "qp/bei_{0}.png", this._bankerRateList[index]);
                }
            } else {
                this._playerList[index].box_rate.visible = true;
                this._playerList[index].box_rate.box_buqiang.visible = !flag;
                this._playerList[index].box_rate.box_qiang.visible = flag;
                this._playerList[index].box_rate.box_bet.visible = false;
                this._playerList[index].box_rate.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "qp/bei_{0}.png", info.BetVal);
                this._playerList[index].box_rate.ani1.play(0, false);
            }
        }

        private onBattleBet(info: any): void {
            let index = this.getUnitUIPos(info.SeatIndex);
            this._playerList[index].box_rate.visible = true;
            this._playerList[index].box_rate.box_bet.visible = true;
            this._playerList[index].box_rate.box_buqiang.visible = false;
            this._playerList[index].box_rate.box_qiang.visible = false;
            this._playerList[index].box_rate.img_betRate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "qp/bei_{0}.png", info.BetVal);
            this._playerList[index].box_rate.ani1.play(0, false);
            this._betTemps[info.SeatIndex - 1] = info.BetVal;
        }

        private onBattlePinPai(info: any, status: number): void {
            let index = this.getUnitUIPos(info.SeatIndex);
            if (index == 0) {
                this._viewUI.img_yiwancheng.visible = true;
            } else {
                this._playerList[index].img_yiwancheng.visible = true;
                if (status == MAP_STATUS.PLAY_STATUS_MATCH_POINT) {
                    this._game.playSound(Path_game_rniuniu.music_niuniu + "gaipai.mp3", false);
                }
            }
        }

        private onBattleSettle(info: any): void {
            this._settleInfo[info.SeatIndex - 1] = info.SettleVal;
            if (this._game.sceneObjectMgr.mainUnit.GetIndex() == info.SeatIndex) {
                this._mainPlayerBenefit = parseFloat(info.SettleVal);
            }
            if (this.getUnitUIPos(info.SeatIndex) == this._bankerIndex) {
                this._bankerBenefit = parseFloat(info.SettleVal);
                this._bankerWinInfo.push(parseFloat(info.SeatIndex));
                this._bankerWinInfo.push(parseFloat(info.SettleVal));
                this._bankerLoseInfo.push(parseFloat(info.SeatIndex));
                this._bankerLoseInfo.push(parseFloat(info.SettleVal));
            } else {
                //庄家赢钱部分
                if (info.SettleVal < 0) {
                    this._bankerWinInfo.push(parseFloat(info.SeatIndex));
                    this._bankerWinInfo.push(parseFloat(info.SettleVal));
                }
                //庄家输钱部分
                if (info.SettleVal > 0) {
                    this._bankerLoseInfo.push(parseFloat(info.SeatIndex));
                    this._bankerLoseInfo.push(parseFloat(info.SettleVal));
                }
            }
        }

        private onBattlePlayCard(info: any): void {
            let unitNum = this.getUnitCount();
            let cardType = this._niuMgr.checkCardsType(info.Cards);
            let playerIndex = this.getUnitUIPos(info.SeatIndex);//玩家真实位置转换为UI位置
            let begin = this.getBeginIndex();//第一个开牌的位置（庄家下一位）
            let headImg = this._game.sceneObjectMgr.getUnitByIdx(info.SeatIndex).GetHeadImg();
            let sex = parseInt(headImg) <= 10 ? 1 : 2;
            this._allType[info.SeatIndex - 1] = cardType;
            for (let i: number = 0; i < unitNum; i++) {
                let index = begin + i >= unitNum ? begin + i - unitNum : begin + i;
                let curIndex = this._unitIndexOnTable[index]
                if (curIndex == playerIndex) {
                    if (curIndex == 0) {//主玩家
                        if (this._curStatus > MAP_STATUS.PLAY_STATUS_MATCH_POINT) {
                            if (this._niuMgr.isReKaiPai) {
                                this.reShowMainCardType(i, cardType, sex);
                            } else {
                                this.showMainCardType(i, cardType, sex);
                            }
                        }
                    } else {//其他玩家
                        if (this._curStatus > MAP_STATUS.PLAY_STATUS_MATCH_POINT) {
                            if (this._niuMgr.isReKaiPai) {
                                this.reShowOtherCardType(curIndex, i, cardType, sex);
                            } else {
                                this.showOtherCardType(curIndex, i, cardType, sex);
                            }
                        }
                    }
                }
            }
        }

        //显示主玩家牌型
        private showMainCardType(i: number, cardType: number, sex: number): void {
            this._viewUI.img_yiwancheng.visible = false;
            Laya.timer.once(1000 + 1000 * i, this, () => {
                this._viewUI.main_cardtype.visible = true;
                this.setCardType(this._viewUI.main_cardtype, cardType, true);
                this._game.playSound(Path_game_rniuniu.music_niuniu + "" + StringU.substitute("niu{0}_{1}.mp3", cardType, sex), false);
            })
        }

        //显示主玩家牌型（断线重连）
        private reShowMainCardType(i: number, cardType: number, sex: number): void {
            this._viewUI.img_yiwancheng.visible = false;
            this._viewUI.main_cardtype.visible = true;
            this._game.playSound(Path_game_rniuniu.music_niuniu + "" + StringU.substitute("niu{0}_{1}.mp3", cardType, sex), false);
            this.setCardType(this._viewUI.main_cardtype, cardType, false);
        }

        //显示其他玩家牌型
        private showOtherCardType(curIndex: number, i: number, cardType: number, sex: number): void {
            this._playerList[curIndex].img_yiwancheng.visible = false;
            Laya.timer.once(1000 + 1000 * i, this, () => {
                this._playerList[curIndex].box_cardType.visible = true;
                this.setCardType(this._playerList[curIndex].box_cardType, cardType, true);
                this._game.playSound(Path_game_rniuniu.music_niuniu + "" + StringU.substitute("niu{0}_{1}.mp3", cardType, sex), false);
            })
        }

        //显示其他玩家牌型（断线重连）
        private reShowOtherCardType(curIndex: number, i: number, cardType: number, sex: number): void {
            this._playerList[curIndex].img_yiwancheng.visible = false;
            this._playerList[curIndex].box_cardType.visible = true;
            this._game.playSound(Path_game_rniuniu.music_niuniu + "" + StringU.substitute("niu{0}_{1}.mp3", cardType, sex), false);
            this.setCardType(this._playerList[curIndex].box_cardType, cardType, false);
        }

        //设置牌型组件，传入组件和牌型
        private setCardType(view: ui.nqp.game_ui.rniuniu.component.NiuPaiUI, cardType: number, isplay: Boolean): void {
            let type: number = 0;//默认没牛
            if (cardType == 0) {//没牛
                isplay && view.ani0.play(0, false);
            } else if (cardType > 0 && cardType < 8) {//牛一到牛七
                type = 1;
                view.type1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                view.rate1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                isplay && view.ani1.play(0, false);
            } else if (cardType >= 8 && cardType < 10) {//牛八，牛九
                type = 2;
                view.type2_1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                view.type2_2.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                view.rate2_1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                view.rate2_2.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                isplay && view.ani2.play(0, false);
            } else if (cardType == 10) {//牛牛
                type = 3;
                view.type3_1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                view.type3_2.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                view.rate3_1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                view.rate3_2.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                isplay && view.ani3.play(0, false);
            } else if (cardType >= 11 && cardType < 13 || cardType == 14) {//四花牛，五花牛，五小牛
                type = 4;
                if (cardType >= 11 && cardType < 13) {//四花牛，五花牛
                    view.typeOne4_1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "tu_{0}.png", cardType == 11 ? "si" : "wu");
                    view.typeOne4_2.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "tu_{0}.png", cardType == 11 ? "si" : "wu");
                    view.typeTwo4_1.skin = Path_game_rniuniu.ui_niuniu + "tu_hua.png";
                    view.typeTwo4_2.skin = Path_game_rniuniu.ui_niuniu + "tu_hua.png";
                } else {//五小牛
                    view.typeOne4_1.skin = Path_game_rniuniu.ui_niuniu + "tu_wu.png";
                    view.typeOne4_2.skin = Path_game_rniuniu.ui_niuniu + "tu_wu.png";
                    view.typeTwo4_1.skin = Path_game_rniuniu.ui_niuniu + "tu_xiao.png";
                    view.typeTwo4_2.skin = Path_game_rniuniu.ui_niuniu + "tu_xiao.png";
                }
                view.rate4_1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                view.rate4_2.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                isplay && view.ani4.play(0, false);
            } else if (cardType == 13) {//炸弹
                type = 5;
                view.rate5_1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                view.rate5_2.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
                isplay && view.ani5.play(0, false);
            }
            for (let i = 0; i < 6; i++) {//显示当前牌型
                view["box" + i].visible = type == i;
            }

        }

        private getBeginIndex(): number {
            let index = this._unitIndexOnTable.indexOf(this._bankerIndex) + 1;
            if (index >= this._unitIndexOnTable.length) index = 0;

            return index;
        }

        //金币变化 飘金币特效
        public addMoneyFly(fromPos: number, tarPos: number): void {
            if (!this._game.mainScene || !this._game.mainScene.camera) return;
            let fromX = this._game.mainScene.camera.getScenePxByCellX(this._playerList[fromPos].x + this._playerList[fromPos].view_icon.x);
            let fromY = this._game.mainScene.camera.getScenePxByCellY(this._playerList[fromPos].y + this._playerList[fromPos].view_icon.y);
            let tarX = this._game.mainScene.camera.getScenePxByCellX(this._playerList[tarPos].x + this._playerList[tarPos].view_icon.x);
            let tarY = this._game.mainScene.camera.getScenePxByCellY(this._playerList[tarPos].y + this._playerList[tarPos].view_icon.y);
            for (let i: number = 0; i < MONEY_NUM; i++) {
                let posBeginX = MathU.randomRange(fromX + 23, fromX + 70);
                let posBeginY = MathU.randomRange(fromY + 23, fromY + 70);
                let posEndX = MathU.randomRange(tarX + 23, tarX + 65);
                let posEndY = MathU.randomRange(tarY + 23, tarY + 65);
                let moneyImg: LImage = new LImage(PathGameTongyong.ui_tongyong_general + "icon_money.png");
                moneyImg.scale(0.7, 0.7);
                if (!moneyImg.parent) this._viewUI.addChild(moneyImg);
                moneyImg.pos(posBeginX, posBeginY);
                // Laya.Bezier 贝塞尔曲线  取得点
                Laya.Tween.to(moneyImg, { x: posEndX }, i * MONEY_FLY_TIME, null);
                Laya.Tween.to(moneyImg, { y: posEndY }, i * MONEY_FLY_TIME, null, Handler.create(this, () => {
                    moneyImg.removeSelf();
                }));
            }
        }

        //金币变化 飘字clip
        public addMoneyClip(value: number, pos: number): void {
            let valueClip = value >= 0 ? new RniuniuClip(RniuniuClip.ADD_MONEY_FONT) : new RniuniuClip(RniuniuClip.SUB_MONEY_FONT);
            let preSkin = value >= 0 ? PathGameTongyong.ui_tongyong_general + "tu_jia.png" : PathGameTongyong.ui_tongyong_general + "tu_jian.png";
            valueClip.scale(value >= 0 ? 1 : 0.8, value >= 0 ? 1 : 0.8);
            valueClip.anchorX = 0.5;
            valueClip.setText(Math.abs(value), true, false, preSkin);
            let playerIcon = this._playerList[pos].view_icon;
            valueClip.x = playerIcon.clip_money.x;
            valueClip.y = playerIcon.clip_money.y;
            playerIcon.clip_money.parent.addChild(valueClip);
            playerIcon.clip_money.visible = false;
            this._clipList.push(valueClip);
            Laya.Tween.clearAll(valueClip);
            Laya.Tween.to(valueClip, { y: valueClip.y - 30 }, 1500);
            if (value > 0) {
                this._playerList[pos].eff_win.visible = true;
                this._playerList[pos].eff_win.ani1.play(0, false);
            }
        }

        //清理所有飘字clip
        private clearClips(): void {
            if (this._clipList && this._clipList.length) {
                for (let i: number = 0; i < this._clipList.length; i++) {
                    let clip = this._clipList[i];
                    clip.removeSelf();
                    clip.destroy(true);
                }
            }
            this._clipList = [];
        }

        //更新倒计时时间戳
        private onUpdateCountDown(): void {
            if (!this._niuMapInfo) return;
            this._countDown = this._niuMapInfo.GetCountDown();
        }

        //设置下注倍数
        private setBetRate(i: number, val: number): void {
            let num1 = 0;
            let num2 = 0;
            if (val >= 10) {
                num1 = 1;
                num2 = val % 10;
                this._playerList[i].img_betRate2.visible = true;
            } else {
                num1 = val;
                this._playerList[i].img_betRate2.visible = false;
            }

        }

        //更新地图状态
        private _noTimer: number[] = [MAP_STATUS.PLAY_STATUS_GAME_START, MAP_STATUS.PLAY_STATUS_GAME_SHUFFLE, MAP_STATUS.PLAY_STATUS_SET_BANKER, MAP_STATUS.PLAY_STATUS_PUSH_CARD, MAP_STATUS.PLAY_STATUS_COMPARE, MAP_STATUS.PLAY_STATUS_SETTLE, MAP_STATUS.PLAY_STATUS_SETTLE_INFO];
        private onUpdateStatus() {
            if (!this._niuMapInfo) return;
            if (this._curStatus == this._niuMapInfo.GetMapState()) return;
            this._curStatus = this._niuMapInfo.GetMapState();
            if (this._curStatus != MAP_STATUS.PLAY_STATUS_GET_BANKER) {
                this._viewUI.box_bankerRate.visible = false;
            }
            if (this._curStatus != MAP_STATUS.PLAY_STATUS_BET) {
                this._viewUI.box_betRate.visible = false;
            }
            if (this._curStatus != MAP_STATUS.PLAY_STATUS_MATCH_POINT) {
                this._viewUI.btn_tanpai.visible = false;
                this._viewUI.box_matchPoint.visible = false;
            }
            if (this._noTimer.indexOf(this._curStatus) != -1) {
                this._viewUI.box_timer.visible = false;
            }
            if (this._curStatus > MAP_STATUS.PLAY_STATUS_GAME_NONE && this._curStatus < MAP_STATUS.PLAY_STATUS_SHOW_GAME) {
                this._pageHandle.pushClose({ id: TongyongPageDef.PAGE_TONGYONG_MATCH, parent: this._game.uiRoot.HUD });
            }
            this._isPlaying = this._curStatus >= MAP_STATUS.PLAY_STATUS_GAME_SHUFFLE && this._curStatus < MAP_STATUS.PLAY_STATUS_SHOW_GAME;
            this._viewUI.btn_dismiss.skin = this._isPlaying || this._niuStory.isCardRoomMaster() ? PathGameTongyong.ui_tongyong_general + "btn_js.png" : PathGameTongyong.ui_tongyong_general + "btn_fh1.png";
            this._viewUI.btn_dismiss.tag = this._isPlaying || this._niuStory.isCardRoomMaster() ? 2 : 1;
            if (this._isPlaying) {
                this._viewUI.box_id.visible = false;
            }
            //游戏开始后初始化投票组件
            if (!this._toupiaoMgr && this._curStatus > MAP_STATUS.PLAY_STATUS_CARDROOM_WAIT) {
                this._toupiaoMgr = TouPiaoMgr.ins;
                this._toupiaoMgr.initUI(this._viewUI.view_tp, this._niuMapInfo, this.getUnitCount(), RniuniuPageDef.GAME_NAME);
            }
            //房卡按钮屏蔽
            this._viewUI.view_card.visible = this._curStatus == MAP_STATUS.PLAY_STATUS_CARDROOM_CREATED || this._curStatus == MAP_STATUS.PLAY_STATUS_CARDROOM_WAIT;
            this._viewUI.text_cardroomid.visible = this._curStatus == MAP_STATUS.PLAY_STATUS_CARDROOM_CREATED || this._curStatus == MAP_STATUS.PLAY_STATUS_CARDROOM_WAIT;
            switch (this._curStatus) {
                case MAP_STATUS.PLAY_STATUS_GAME_NONE:// 准备阶段
                    break;
                case MAP_STATUS.PLAY_STATUS_GAME_SHUFFLE:// 洗牌阶段
                    this._pageHandle.pushClose({ id: RniuniuPageDef.PAGE_RNIUNIU_CARDROOM_SETTLE, parent: this._game.uiRoot.HUD });
                    this.clearClips();
                    this.resetUI();
                    this.resetData();
                    this._game.sceneObjectMgr.clearOfflineObject();
                    this._viewUI.xipai.x = 640;
                    this._viewUI.xipai.y = 310;
                    this._viewUI.xipai.scaleX = 1;
                    this._viewUI.xipai.scaleY = 1;
                    this._viewUI.xipai.alpha = 1;
                    this._viewUI.xipai.rotation = 0;
                    this._viewUI.xipai.visible = true;
                    this._viewUI.xipai.ani_xipai.play(0, false);
                    this._isPlayXiPai = true;
                    break;
                case MAP_STATUS.PLAY_STATUS_GAME_START:// 游戏开始
                    this._pageHandle.pushOpen({ id: TongyongPageDef.PAGE_TONGYONG_GAMESTART, parent: this._game.uiRoot.HUD });
                    this._game.playSound(Path_game_rniuniu.music_niuniu + "kaishi.mp3", false);
                    this._viewUI.box_tips.visible = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_GET_BANKER:// 开始抢庄
                    this._pageHandle.pushClose({ id: TongyongPageDef.PAGE_TONGYONG_GAMESTART, parent: this._game.uiRoot.HUD });
                    break;
                case MAP_STATUS.PLAY_STATUS_SET_BANKER:// 定庄阶段
                    this._viewUI.box_tips.visible = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_BET:// 下注阶段
                    Laya.timer.clear(this, this.ranEffPos);
                    this._kuangView.removeSelf();
                    for (let i: number = 0; i < RniuniuMgr.MAX_NUM; i++) {
                        if (this._bankerIndex == i) {
                            if (this._playerList[i].box_rate.box_buqiang.visible) {
                                this._playerList[i].box_rate.box_qiang.visible = true;
                                this._playerList[i].box_rate.box_buqiang.visible = false;
                                this._playerList[i].box_rate.box_bet.visible = false;
                                this._playerList[i].box_rate.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "qp/bei_1.png");
                            }
                        } else {
                            this._playerList[i].box_rate.visible = false;
                        }
                    }
                    break;
                case MAP_STATUS.PLAY_STATUS_PUSH_CARD:// 发牌阶段
                    this._viewUI.paixie.ani2.play(0, true);
                    this._viewUI.box_tips.visible = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_MATCH_POINT:// 配牛阶段
                    this._niuMgr.isReKaiPai = false;
                    if (localGetItem("rniuniu") == "0") {
                        this._viewUI.box_xinshou.visible = true;
                        Laya.timer.once(5000, this, () => {
                            localSetItem("rniuniu", "1");
                            this._viewUI.box_xinshou.visible = false;
                        });
                    }
                    break;
                case MAP_STATUS.PLAY_STATUS_COMPARE:// 比牌阶段
                    this._viewUI.box_tips.visible = false;
                    this._viewUI.box_xinshou.visible = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_SETTLE:// 结算阶段
                    this._viewUI.box_tips.visible = false;
                    this.addBankerWinEff();
                    let timeInternal = MONEY_NUM * MONEY_FLY_TIME;
                    Laya.timer.once(timeInternal, this, () => {
                        this.addBankerLoseEff();
                        this.updateMoney();
                    });
                    Laya.timer.once(2000, this, () => {
                        //庄家通杀(大于2个人才有)
                        if (this._bankerLoseInfo.length == 2 && this.getUnitCount() > 2) {
                            this._game.playSound(Path_game_rniuniu.music_niuniu + "zjtongchi.mp3", false);
                            this._game.uiRoot.HUD.open(TongyongPageDef.PAGE_TONGYONG_ZJTS);
                        }
                        //庄家通赔(大于2个人才有)
                        else if (this._bankerWinInfo.length == 2 && this.getUnitCount() > 2) {
                            // this._game.playSound(Path_game_rniuniu.music_niuniu + "zjtongchi.mp3", false);
                            this._game.uiRoot.HUD.open(TongyongPageDef.PAGE_TONGYONG_ZJTP);
                        } else {
                            if (this._mainPlayerBenefit > 0) {
                                let rand = MathU.randomRange(1, 3);
                                this._game.playSound(StringU.substitute(PathGameTongyong.music_tongyong + "win{0}.mp3", rand), true);
                                this._game.uiRoot.HUD.open(TongyongPageDef.PAGE_TONGYONG_GAMEWIN);
                            } else {
                                let rand = MathU.randomRange(1, 4);
                                this._game.playSound(StringU.substitute(PathGameTongyong.music_tongyong + "lose{0}.mp3", rand), true);
                            }
                        }
                    });
                    //庄家通杀(大于2个人才有)
                    if (this._bankerLoseInfo.length == 2 && this.getUnitCount() > 2) {
                        Laya.timer.once(4000, this, () => {
                            this._game.uiRoot.HUD.close(TongyongPageDef.PAGE_TONGYONG_ZJTS);
                            if (this._mainPlayerBenefit > 0) {
                                let rand = MathU.randomRange(1, 3);
                                this._game.playSound(StringU.substitute(PathGameTongyong.music_tongyong + "win{0}.mp3", rand), true);
                                this._game.uiRoot.HUD.open(TongyongPageDef.PAGE_TONGYONG_GAMEWIN);
                            } else {
                                let rand = MathU.randomRange(1, 4);
                                this._game.playSound(StringU.substitute(PathGameTongyong.music_tongyong + "lose{0}.mp3", rand), true);
                            }
                        });
                    }
                    //庄家通赔(大于2个人才有)
                    else if (this._bankerWinInfo.length == 2 && this.getUnitCount() > 2) {
                        Laya.timer.once(4000, this, () => {
                            this._game.uiRoot.HUD.close(TongyongPageDef.PAGE_TONGYONG_ZJTP);
                            if (this._mainPlayerBenefit > 0) {
                                let rand = MathU.randomRange(1, 3);
                                this._game.playSound(StringU.substitute(PathGameTongyong.music_tongyong + "win{0}.mp3", rand), true);
                                this._game.uiRoot.HUD.open(TongyongPageDef.PAGE_TONGYONG_GAMEWIN);
                            } else {
                                let rand = MathU.randomRange(1, 4);
                                this._game.playSound(StringU.substitute(PathGameTongyong.music_tongyong + "lose{0}.mp3", rand), true);
                            }
                        });
                    }
                    break;
                case MAP_STATUS.PLAY_STATUS_SETTLE_INFO:// 显示结算信息
                    this.openCardSettlePage();
                    this._isDoBanker = false;
                    this._isDoBet = false;
                    this._niuStory.isReConnected = false;
                    this._toupiaoMgr.resetData();
                    this._pageHandle.pushClose({ id: TongyongPageDef.PAGE_TONGYONG_ZJTS, parent: this._game.uiRoot.HUD });
                    this._pageHandle.pushClose({ id: TongyongPageDef.PAGE_TONGYONG_ZJTP, parent: this._game.uiRoot.HUD });
                    break;
                case MAP_STATUS.PLAY_STATUS_SHOW_GAME:// 本局展示阶段
                    this.openCardSettlePage();
                    //游戏结束后解散都改为返回，点击直接回到大厅
                    this._viewUI.btn_dismiss.skin = PathGameTongyong.ui_tongyong_general + "btn_fh1.png";
                    this._viewUI.btn_dismiss.tag = 1;
                    this._pageHandle.pushClose({ id: TongyongPageDef.PAGE_TONGYONG_ZJTS, parent: this._game.uiRoot.HUD });
                    this._pageHandle.pushClose({ id: TongyongPageDef.PAGE_TONGYONG_ZJTP, parent: this._game.uiRoot.HUD });
                    break;
            }

            this._pageHandle.updatePageHandle();//更新额外界面的开关状态
            this._pageHandle.reset();//清空额外界面存储数组
        }

        private chargeArgs(temp, flag): boolean {
            for (let i = 0; i < temp.length; i++) {
                if (flag) {
                    if (temp[i] != -1) {
                        return true;
                    }
                } else {
                    if (temp[i] != 0) {
                        return true;
                    }
                }
            }
            return false;
        }

        //打开房卡结算界面
        private _betTemps: any = [0, 0, 0, 0, 0];    //各个精灵下注倍数
        private _settleInfo: any = [0, 0, 0, 0, 0];  //各个精灵结算收益
        private _allType: any = [-1, -1, -1, -1, -1];     //各个精灵牌型
        private openCardSettlePage(): void {
            if (!this.chargeArgs(this._betTemps, false)) return;
            if (!this.chargeArgs(this._settleInfo, false)) return;
            if (!this.chargeArgs(this._allType, true)) return;
            if (!this._niuMapInfo) return;
            let temps = [];
            let infoTemps = [];
            for (let i = 0; i < 5; i++) {
                let unit = this._game.sceneObjectMgr.getUnitByIdx(i + 1)
                if (unit) {
                    let betNum: number = this._betTemps[i]; //下注倍数
                    let jifen: number = this._settleInfo[i];  //结算金币
                    let cardType: string = CARD_TYPE[this._allType[i]]; //牌型
                    let identity: number = unit.GetIdentity(); //身份
                    let name: string = unit.GetName(); //名字
                    let totalJiFen: number = unit.GetMoney(); //积分
                    if (unit) {
                        let obj = {
                            isMain: this._game.sceneObjectMgr.mainUnit.GetIndex() == i + 1,
                            isbanker: identity == 1,
                            name: name,
                            difen: ROOM_CONFIG[this._niuStory.mapLv][0],
                            betRate: betNum ? "" + betNum : "--",
                            bankerRate: identity == 1 ? this._bankerRate == 0 ? "1" : "" + this._bankerRate : "--",
                            jiFen: EnumToString.getPointBackNum(jifen, 2),
                            totalJiFen: EnumToString.getPointBackNum(totalJiFen, 2),
                            cardtype: cardType,
                        }
                        temps.push(obj);
                    }
                }
            }
            infoTemps.push(this._niuMapInfo.GetRound());
            infoTemps.push(this._toupiaoSuccess ? this._niuMapInfo.GetRound() : this._niuMapInfo.GetCardRoomGameNumber());
            infoTemps.push(this._niuMapInfo.GetCountDown());
            infoTemps.push(temps);
            this._pageHandle.pushOpen({ id: RniuniuPageDef.PAGE_RNIUNIU_CARDROOM_SETTLE, dataSource: infoTemps, parent: this._game.uiRoot.HUD });
        }

        private _isDoBanker: boolean = false;//抢庄是否已操作
        private _isDoBet: boolean = false;//下注是否已操作
        //按钮缓动回调
        protected onBtnTweenEnd(e: any, target: any): void {
            switch (target) {
                case this._viewUI.btn_spread://菜单
                    this.showMenu(true);
                    break;
                case this._viewUI.btn_rule://规则
                    this._game.uiRoot.general.open(RniuniuPageDef.PAGE_RNIUNIU_RULE);
                    break;
                case this._viewUI.btn_chongzhi://充值
                    this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
                    break;
                case this._viewUI.btn_set://设置
                    this._game.uiRoot.general.open(TongyongPageDef.PAGE_TONGYONG_SETTING)
                    break;
                case this._viewUI.btn_tanpai://摊牌
                    this._game.playSound(Path_game_rniuniu.music_niuniu + "pingpaiwancheng.mp3", false);
                    this._niuMgr.gaipai();
                    this._niuStory.isGaiPai = true;
                    this._game.network.call_rniuniu_pinpai();
                    this._viewUI.box_matchPoint.visible = false;
                    this._viewUI.btn_tanpai.visible = false;
                    this._viewUI.box_xinshou.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家拼牌...";
                    break;
                case this._viewUI.btn_zhanji://战绩
                    this._game.uiRoot.general.open(TongyongPageDef.PAGE_TONGYONG_RECORD, (page) => {
                        page.dataSource = {
                            gameid: RniuniuPageDef.GAME_NAME,
                            isCardRoomType: this._niuStory instanceof gamecomponent.story.StoryRoomCardBase,
                        };
                    });
                    break;
                case this._viewUI.btn_qifu://祈福
                    this._game.uiRoot.general.open(DatingPageDef.PAGE_QIFU);
                    break;
                case this._viewUI.box_xinshou://新手提示
                    this._viewUI.box_xinshou.visible = false;
                    break;
                case this._viewUI.btn_dismiss://返回
                    if (this._viewUI.btn_dismiss.tag == 1) {
                        this.clearClips();
                        this.resetData();
                        this.clearMapInfoListen();
                        this._game.sceneObjectMgr.leaveStory(true);
                        logd("玩家发送离开地图协议，离开房间")
                    } else {
                        //房卡解散
                        this.masterDismissCardGame();
                    }
                    break;
                case this._viewUI.btn_bankerRate0://不抢庄
                    this._game.network.call_rniuniu_banker(0);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._isDoBanker = true;
                    this._viewUI.txt_tips.text = "等待其他玩家抢庄...";
                    break;
                case this._viewUI.btn_bankerRate1://抢庄倍数1
                    this._game.network.call_rniuniu_banker(1);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._isDoBanker = true;
                    this._viewUI.txt_tips.text = "等待其他玩家抢庄...";
                    break;
                case this._viewUI.btn_bankerRate2://抢庄倍数2
                    this._game.network.call_rniuniu_banker(2);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._isDoBanker = true;
                    this._viewUI.txt_tips.text = "等待其他玩家抢庄...";
                    break;
                case this._viewUI.btn_bankerRate3://抢庄倍数3
                    this._game.network.call_rniuniu_banker(3);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._isDoBanker = true;
                    this._viewUI.txt_tips.text = "等待其他玩家抢庄...";
                    break;
                case this._viewUI.btn_betRate1://下注倍数1
                    this._game.network.call_rniuniu_bet(this._betList[0]);
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._isDoBet = true;
                    this._viewUI.txt_tips.text = "等待其他玩家下注...";
                    break;
                case this._viewUI.btn_betRate2://下注倍数2
                    this._game.network.call_rniuniu_bet(this._betList[1]);
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._isDoBet = true;
                    this._viewUI.txt_tips.text = "等待其他玩家下注...";
                    break;
                case this._viewUI.btn_betRate3://下注倍数3
                    this._game.network.call_rniuniu_bet(this._betList[2]);
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._isDoBet = true;
                    this._viewUI.txt_tips.text = "等待其他玩家下注...";
                    break;
                case this._viewUI.btn_betRate4://下注倍数4
                    this._game.network.call_rniuniu_bet(this._betList[3]);
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._isDoBet = true;
                    this._viewUI.txt_tips.text = "等待其他玩家下注...";
                    break;
                case this._viewUI.view_card.btn_invite://房卡邀请
                    // 微信邀请玩家参与房卡游戏
                    logd("btn_invite:", this._niuMapInfo.GetCardRoomId());
                    if (this._niuMapInfo.GetCardRoomId()) {
                        this._game.network.call_get_roomcard_share(RniuniuPageDef.GAME_NAME);
                    }
                    break;
                case this._viewUI.view_card.btn_start://房卡开始
                    this.setCardGameStart();
                    break;
                default:
                    break;
            }
        }

        protected onMouseClick(e: LEvent) {
            if (e.target != this._viewUI.btn_spread) {
                this.showMenu(false);
            }
        }

        showMenu(isShow: boolean) {
            if (isShow) {
                this._viewUI.box_menu.visible = true;
                this._viewUI.btn_spread.visible = false;
                this._viewUI.box_menu.y = -this._viewUI.box_menu.height;
                Laya.Tween.to(this._viewUI.box_menu, { y: 10 }, 300, Laya.Ease.circIn)
            } else {
                if (this._viewUI.box_menu.y >= 0) {
                    Laya.Tween.to(this._viewUI.box_menu, { y: -this._viewUI.box_menu.height }, 300, Laya.Ease.circIn, Handler.create(this, () => {
                        this._viewUI.btn_spread.visible = true;
                        this._viewUI.box_menu.visible = false;
                    }));
                }
            }
        }

        private onUpdateGameRound(): void {
            if (!this._niuMapInfo) return;
            if (this._niuMapInfo.GetRound() && this._niuMapInfo.GetCardRoomGameNumber()) {
                this._viewUI.box_dizhu.visible = true;
                this._viewUI.box_cardid.visible = false;
                this._viewUI.txt_round.text = StringU.substitute("局数：{0}/{1}", this._niuMapInfo.GetRound(), this._niuMapInfo.GetCardRoomGameNumber());
            } else {
                this._viewUI.box_dizhu.visible = false;
                this._viewUI.box_cardid.visible = true;
            }
        }

        private onUpdateGameNo(): void {
            if (!this._niuMapInfo) return;
            if (this._niuMapInfo.GetGameNo()) {
                this._viewUI.box_id.visible = true;
                this._viewUI.txt_id.text = "牌局号：" + this._niuMapInfo.GetGameNo();
            }
        }

        private _qifuTypeImgUrl: string;
        private qifuFly(dataSource: any): void {
            if (!dataSource) return;
            let dataInfo = dataSource;
            this._game.qifuMgr.showFlayAni(this._viewUI.view0.view_icon, this._viewUI, dataSource, Handler.create(this, () => {
                //相对应的玩家精灵做出反应
                this._qifuTypeImgUrl = TongyongUtil.getQFTypeImg(dataInfo.qf_id);
                this.onUpdateUnit(dataInfo.qifu_index);
            }));
        }

        protected onOptHandler(optcode: number, msg: any) {
            if (msg.type == Operation_Fields.OPRATE_TELEPORT) {
                switch (msg.reason) {
                    case Operation_Fields.OPRATE_TELEPORT_MAP_CREATE_ROOM_SUCCESS://在地图中重新创建房间成功
                        this.clearClips();
                        this.resetUI();
                        this.resetData();
                        this._battleIndex = -1;
                        this._game.sceneObjectMgr.clearOfflineObject();
                        break;
                }
            }
        }

        protected onSucessHandler(data: any) {
            if (data.code == Web_operation_fields.CLIENT_IRCODE_GET_ROOMCARD_SHARE) {
                if (data && data.success == 0) {
                    let img_url: string = data.msg.img_url;
                    let wx_context: string = data.msg.context || RniuniuMgr.WXSHARE_DESC;
                    let wx_title: string = data.msg.title + this._niuMapInfo.GetCardRoomId() || StringU.substitute(RniuniuMgr.WXSHARE_TITLE, this._niuMapInfo.GetCardRoomId());
                    this._game.wxShareUrl(wx_title, wx_context, img_url);
                }
            }
        }

        private initView(): void {
            //界面UI
            this._kuangView = new ui.nqp.game_ui.tongyong.effect.SuiJiUI();
            this._viewUI.box_tips.visible = false;
            this._viewUI.box_bankerRate.visible = false;
            this._viewUI.box_betRate.visible = false;
            this._viewUI.box_timer.visible = false;
            this._viewUI.box_xinshou.visible = false;
            this._viewUI.box_id.visible = false;
            this._viewUI.xipai.visible = false;
            this._viewUI.paixie.ani2.gotoAndStop(0);
            this._viewUI.paixie.cards.visible = false;
            this._viewUI.paixie.ani_chupai.gotoAndStop(0);
            this._viewUI.box_menu.visible = false;
            this._viewUI.box_menu.zOrder = 99;
            this._viewUI.box_dizhu.visible = false;

            this._playerList = [];
            for (let i: number = 0; i < RniuniuMgr.MAX_NUM; i++) {
                this._playerList.push(this._viewUI["view" + i])
            }
            for (let i: number = 0; i < RniuniuMgr.MAX_NUM; i++) {
                this._playerList[i].visible = false;
                this._playerList[i].box_rate.visible = false;
                this._playerList[i].eff_win.visible = false;
                this._playerList[i].view_icon.clip_money.visible = false;
                this._playerList[i].view_icon.img_banker.visible = false;
                if (i > 0) {
                    this._playerList[i].box_cardType.visible = false;
                    this._playerList[i].img_yiwancheng.visible = false;
                }
            }

            //主玩家UI
            this._viewUI.main_cardtype.visible = false;
            this._viewUI.btn_tanpai.visible = false;
            this._viewUI.box_matchPoint.visible = false;
            this._viewUI.img_yiwancheng.visible = false;
            this._viewUI.txt_point0.text = "";
            this._viewUI.txt_point1.text = "";
            this._viewUI.txt_point2.text = "";
            this._viewUI.txt_pointTotal.text = "";
        }

        //重置UI
        private resetUI(): void {
            for (let i: number = 0; i < RniuniuMgr.MAX_NUM; i++) {
                this._playerList[i].box_rate.visible = false;
                this._playerList[i].eff_win.visible = false;
                this._playerList[i].view_icon.clip_money.visible = false;
                this._playerList[i].view_icon.img_banker.visible = false;
                if (i > 0) {
                    this._playerList[i].box_cardType.visible = false;
                    this._playerList[i].img_yiwancheng.visible = false;
                }
            }

            //主玩家UI
            this._viewUI.main_cardtype.visible = false;
            this._viewUI.btn_tanpai.visible = false;
            this._viewUI.box_matchPoint.visible = false;
            this._viewUI.img_yiwancheng.visible = false;
            this._viewUI.txt_point0.text = "";
            this._viewUI.txt_point1.text = "";
            this._viewUI.txt_point2.text = "";
            this._viewUI.txt_pointTotal.text = "";

            //界面UI
            this._viewUI.box_tips.visible = false;
            this._viewUI.box_bankerRate.visible = false;
            this._viewUI.box_betRate.visible = false;
            this._viewUI.box_timer.visible = false;
            this._viewUI.box_xinshou.visible = false;
            this._viewUI.paixie.cards.visible = false;
            this._viewUI.paixie.ani_chupai.stop();
        }

        private resetData(): void {
            this._getBankerCount = 0;
            this._bankerRateInfo = [];
            this._bankerWinInfo = [];
            this._bankerLoseInfo = [];
            this._betList = [];
            this._bankerList = [];
            this._room_config = [];
            this._betTemps = [0, 0, 0, 0, 0];
            this._settleInfo = [0, 0, 0, 0, 0];
            this._allType = [0, 0, 0, 0, 0];
        }

        private clearMapInfoListen(): void {
            this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_STATUS_CHECK, this, this.onUpdateStatus);
            this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_BATTLE_CHECK, this, this.onUpdateBattle);
            this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_GAME_ROUND_CHANGE, this, this.onUpdateGameRound);
            this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_GAME_NO, this, this.onUpdateGameNo);//牌局号
            this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_COUNT_DOWN, this, this.onUpdateCountDown);//倒计时更新

            this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_ADD_UNIT, this, this.onUnitAdd);
            this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_REMOVE_UNIT, this, this.onUnitRemove);
            this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_MONEY_CHANGE, this, this.onUpdateUnit);
            this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_CHANGE, this, this.onUpdateUnit);
            this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_ACTION, this, this.onUpdateUnit);
            this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_QIFU_TIME_CHANGE, this, this.onUpdateUnit);
            this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_MAPINFO_CHANGE, this, this.onUpdateMapInfo);
            this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_MAIN_UNIT_CHANGE, this, this.updateCardRoomDisplayInfo);
            this._game.network.removeHanlder(Protocols.SMSG_OPERATION_FAILED, this, this.onOptHandler);
            Laya.Tween.clearAll(this);
            Laya.timer.clearAll(this);
        }

        public close(): void {
            if (this._viewUI) {
                this._viewUI.btn_spread.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_rule.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_chongzhi.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_set.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_bankerRate0.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_bankerRate1.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_bankerRate2.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_bankerRate3.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_betRate1.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_betRate2.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_betRate3.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_betRate4.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_tanpai.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_zhanji.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.view_card.btn_start.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.view_card.btn_invite.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_dismiss.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_qifu.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.box_xinshou.off(LEvent.CLICK, this, this.onBtnClickWithTween);

                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_STATUS_CHECK, this, this.onUpdateStatus);
                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_BATTLE_CHECK, this, this.onUpdateBattle);
                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_GAME_ROUND_CHANGE, this, this.onUpdateUnit);//继续游戏状态改变后
                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_GAME_NO, this, this.onUpdateGameNo);//牌局号
                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_COUNT_DOWN, this, this.onUpdateCountDown);//倒计时更新

                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_NAME_CHANGE, this, this.onUnitComing);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_OPRATE_SUCESS, this, this.onSucessHandler);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_ADD_UNIT, this, this.onUnitAdd);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_REMOVE_UNIT, this, this.onUnitRemove);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_MONEY_CHANGE, this, this.onUpdateUnit);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_CHANGE, this, this.onUpdateUnit);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_ACTION, this, this.onUpdateUnit);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_MAPINFO_CHANGE, this, this.onUpdateMapInfo);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_MAIN_UNIT_CHANGE, this, this.updateCardRoomDisplayInfo);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_QIFU_TIME_CHANGE, this, this.onUpdateUnit);

                this._game.qifuMgr.off(QiFuMgr.QIFU_FLY, this, this.qifuFly);
                this._viewUI.xipai.ani_xipai.off(LEvent.COMPLETE, this, this.onWashCardOver);
                this._game.mainScene.off(SceneOperator.AVATAR_MOUSE_CLICK_HIT, this, this.onUpdatePoint);
                if (this._toupiaoMgr) {
                    this._toupiaoMgr.clear(true);
                    this._toupiaoMgr = null;
                }
                if (this._niuMgr) {
                    this._niuMgr.off(RniuniuMgr.DEAL_OVER, this, this.onUpdateAniDeal);
                }
                this._game.network.removeHanlder(Protocols.SMSG_OPERATION_FAILED, this, this.onOptHandler);
                Laya.Tween.clearAll(this);
                Laya.timer.clearAll(this);
                this.clearClips();
                this.resetData();
                this.clearMapInfoListen();
                this._game.stopAllSound();
                this._game.stopMusic();
                this._kuangView && this._kuangView.removeSelf();
                this.clearBeiClip();
            }
            super.close();
        }
    }
}