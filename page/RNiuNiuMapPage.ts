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
    // 下注倍率配置
    const RATE_LIST = {
        "1": [1],
        "2": [1, 2],
        "3": [1, 2, 3],
        "4": [1, 2, 3, 4],
        "5": [1, 2, 3, 5],
        "6": [1, 2, 4, 6],
        "7": [1, 3, 5, 7],
        "8": [1, 3, 5, 8],
        "9": [1, 3, 6, 9],
        "10": [1, 3, 6, 10],
        "11": [1, 4, 7, 11],
        "12": [1, 4, 8, 12],
        "13": [1, 4, 9, 13],
        "14": [1, 5, 10, 14],
        "15": [1, 5, 10, 15],
    };
    // 房间底注和限入配置
    const ROOM_CONFIG = {
        "21": [1, 20],    //新手
        "22": [10, 200],  //初级
        "23": [50, 500],  //中级
        "24": [100, 1000],    //高级
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
        // 房卡系列
        private _totalPoint: Array<number> = [0, 0, 0, 0, 0];  // 当前玩家累计积分 分别是座位号-积分值 
        private _isPlaying: boolean = false;    //是否进行中
        private _isGameEnd: boolean = false;    //是否本局游戏结束

        constructor(v: Game, onOpenFunc?: Function, onCloseFunc?: Function) {
            super(v, onOpenFunc, onCloseFunc);
            this._isNeedDuang = false;
            this._delta = 1000;
            this._asset = [
                PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "pai.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "general.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "touxiang.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "qifu.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "qz.atlas",
                Path_game_rniuniu.atlas_game_ui + "niuniu.atlas",
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
            this._viewUI = this.createView('game_ui.niuniu.QiangZhuangNNUI');
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
            if (this._niuStory instanceof gamecomponent.story.StoryRoomCardBase) {
                this.onUpdateMapInfo();
            } else if (!this._niuStory.isReConnected) {
                this._game.uiRoot.general.open(TongyongPageDef.PAGE_TONGYONG_MATCH, null, (page) => {
                    this._viewUI.btn_continue.visible = page.dataSource;
                });
            } else {
                this.onUpdateMapInfo();
            }

            this.onUpdateUnitOffline();//初始化假的主玩家

            //所有监听
            this._viewUI.btn_spread.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_cardType.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_back.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_rule.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_chongzhi.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_set.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_continue.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_bankerRate0.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_bankerRate1.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_bankerRate2.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_bankerRate3.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_betRate1.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_betRate2.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_betRate3.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_betRate4.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_niu.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_notNiu.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_zhanji.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.view_card.btn_start.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.view_card.btn_invite.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.view_card.btn_dismiss.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._viewUI.btn_qifu.on(LEvent.CLICK, this, this.onBtnClickWithTween);
            this._game.sceneObjectMgr.on(SceneObjectMgr.EVENT_OPRATE_SUCESS, this, this.onSucessHandler);
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
            if (this._curStatus == MAP_STATUS.PLAY_STATUS_SET_BANKER || this._curStatus == MAP_STATUS.PLAY_STATUS_GAME_START || this._curStatus == MAP_STATUS.PLAY_STATUS_PUSH_CARD
                || this._curStatus == MAP_STATUS.PLAY_STATUS_COMPARE || this._curStatus == MAP_STATUS.PLAY_STATUS_GAME_SHUFFLE || this._curStatus == MAP_STATUS.PLAY_STATUS_SETTLE) {
                return;
            }
            let curTime = this._game.sync.serverTimeBys;
            let time = Math.floor(this._countDown - curTime);
            if (time > 0) {
                this._viewUI.box_timer.visible = true;
                this._viewUI.box_timer.txt_time.text = time.toString();

            } else {
                this._viewUI.box_timer.visible = false;
            }
        }

        /******************************房卡专用****************************** */
        get isCardRoomType() {
            return this._niuStory instanceof gamecomponent.story.StoryRoomCardBase;
        }

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
            this._viewUI.view_card.visible = this.isCardRoomType;
            this._viewUI.text_cardroomid.visible = this.isCardRoomType;
            if (this.isCardRoomType) {
                this._viewUI.text_cardroomid.text = "房间号：" + this._niuMapInfo.GetCardRoomId();
                this._viewUI.view_card.btn_invite.visible = true;
                this._viewUI.view_card.btn_invite.x = this._niuStory.isCardRoomMaster() ? 420 : this._viewUI.view_card.btn_start.x;
                this._viewUI.view_card.btn_dismiss.visible = this._niuStory.isCardRoomMaster();
                this._viewUI.view_card.btn_start.visible = this._niuStory.isCardRoomMaster();
            }
        }

        // 是否可以提前终止游戏
        private canEndCardGame() {
            if (this._isPlaying) {
                TongyongPageDef.ins.alertRecharge(StringU.substitute("游戏中禁止退出，请先完成本轮" + this._niuMapInfo.GetCardRoomGameNumber() + "局游戏哦~~"), () => {
                }, () => {
                }, true);
                return false;
            }
            return !this._isPlaying;
        }

        // 房卡模式解散游戏,是否需要房主限制
        private masterDismissCardGame() {
            let mainUnit: Unit = this._game.sceneObjectMgr.mainUnit;
            if (!mainUnit) return;
            if (mainUnit.GetRoomMaster() != 1) {
                TongyongPageDef.ins.alertRecharge(StringU.substitute("只有房主才可以解散房间哦"), () => {
                }, () => {
                }, true);
            } else {
                if (!this._isGameEnd) {
                    TongyongPageDef.ins.alertRecharge("游戏未开始，解散房间不会扣除金币！\n是否解散房间？", () => {
                        this._niuStory.endRoomCardGame(mainUnit.GetIndex(), this._niuMapInfo.GetCardRoomId());
                        this._game.sceneObjectMgr.leaveStory(true);
                    }, null, false, PathGameTongyong.ui_tongyong_general + "btn_tx.png");
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
            this._niuMgr.totalUnitCount = this.getUnitCount();
            if (this._niuMgr.totalUnitCount < RniuniuMgr.MIN_CARD_SEATS_COUNT) {
                TongyongPageDef.ins.alertRecharge(StringU.substitute("老板，再等等嘛，需要两个人才可以开始"), () => {
                }, () => {
                }, true);
                return;
            }
            this._niuStory.startRoomCardGame(mainUnit.guid, this._niuMapInfo.GetCardRoomId());
        }
        /******************************************************************** */


        //玩家进来了
        private onUnitAdd(u: Unit) {
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
                if (this._curStatus > MAP_STATUS.PLAY_STATUS_GAME_NONE) {
                    this._viewUI.paixie.cards.visible = true;
                }
                this._viewUI.btn_continue.visible = false;
                if (this._niuStory.isReConnected) {
                    this._niuStory.mapLv = mapinfo.GetMapLevel();
                    this._isGameEnd = false;
                    this.initRoomConfig();
                    this.onUpdateGameNo();
                    this.onUpdateGameRound();
                }
                if (this.isCardRoomType) {
                    this.initRoomConfig();
                    this.updateCardRoomDisplayInfo();
                }
            } else {
                this.onUpdateUnitOffline();
                this._game.uiRoot.general.open(TongyongPageDef.PAGE_TONGYONG_MATCH, null, (page) => {
                    this._viewUI.btn_continue.visible = page.dataSource;
                });
                this._viewUI.btn_continue.visible = false;
            }
        }

        private onUpdateUnitOffline() {
            if (!this._niuMgr.offlineUnit) return;
            let unitOffline = this._niuMgr.offlineUnit;
            let mPlayer = this._game.sceneObjectMgr.mainPlayer;
            if (unitOffline) {
                this._viewUI.view0.visible = true;
                let money;
                if (mPlayer) {
                    if (!mPlayer.playerInfo) return;
                    money = mPlayer.playerInfo.money;
                    this._viewUI.view0.view_icon.txt_name.text = getMainPlayerName(mPlayer.playerInfo.nickname);
                    this._viewUI.view0.view_icon.img_icon.skin = PathGameTongyong.ui_tongyong_touxiang + "head_" + mPlayer.playerInfo.headimg + ".png";
                    this._viewUI.view0.view_icon.img_qifu.visible = mPlayer.playerInfo.qifu_endtime > this._game.sync.serverTimeBys;
                    if (this._viewUI.view0.view_icon.img_qifu.visible && mPlayer.playerInfo.qifu_type) {
                        this._viewUI.view0.view_icon.img_icon.skin = PathGameTongyong.ui_tongyong_touxiang + "head_" + this._nameStrInfo[mPlayer.playerInfo.qifu_type - 1] + ".png";
                    }
                    //头像框
                    this._viewUI.view0.view_icon.img_txk.visible = mPlayer.playerInfo.vip_level > 0;
                    if (this._viewUI.view0.view_icon.img_txk.visible) {
                        this._viewUI.view0.view_icon.img_txk.skin = PathGameTongyong.ui_tongyong_touxiang + "tu_v" + mPlayer.playerInfo.vip_level + ".png";
                    }
                } else {
                    money = unitOffline.GetMoney();
                    this._viewUI.view0.view_icon.txt_name.text = getMainPlayerName(unitOffline.GetName());
                    this._viewUI.view0.view_icon.img_icon.skin = PathGameTongyong.ui_tongyong_touxiang + "head_" + unitOffline.GetHeadImg() + ".png";
                    this._viewUI.view0.view_icon.img_qifu.visible = unitOffline.GetQiFuEndTime() > this._game.sync.serverTimeBys;
                    if (this._viewUI.view0.view_icon.img_qifu.visible && unitOffline.GetQiFuType()) {
                        this._viewUI.view0.view_icon.img_icon.skin = PathGameTongyong.ui_tongyong_touxiang + "head_" + this._nameStrInfo[unitOffline.GetQiFuType() - 1] + ".png";
                    }
                    //头像框
                    this._viewUI.view0.view_icon.img_txk.visible = unitOffline.GetVipLevel() > 0;
                    if (this._viewUI.view0.view_icon.img_txk.visible) {
                        this._viewUI.view0.view_icon.img_txk.skin = PathGameTongyong.ui_tongyong_touxiang + "tu_v" + unitOffline.GetVipLevel() + ".png";
                    }
                }
                this._viewUI.view0.view_icon.txt_money.text = EnumToString.getPointBackNum(money, 2).toString();
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
                    let iconUrl = PathGameTongyong.ui_tongyong_touxiang + "head_" + unit.GetHeadImg() + ".png";
                    if (unit.type == UnitField.TYPE_ID_PLAYER) {
                        if (unit.GetIndex() == idx) {
                            iconUrl = PathGameTongyong.ui_tongyong_touxiang + "head_" + this._game.sceneObjectMgr.mainPlayer.playerInfo.headimg + ".png";
                        }
                    }
                    this._playerList[index].view_icon.txt_name.text = getMainPlayerName(unit.GetName());
                    this._playerList[index].view_icon.img_icon.skin = iconUrl;
                    if ((this._curStatus != MAP_STATUS.PLAY_STATUS_COMPARE && this._curStatus != MAP_STATUS.PLAY_STATUS_SETTLE) || this._niuStory.isReConnected) {
                        this.updateMoney();
                    }
                    // this._playerList[index].img_isReady.visible = unit.IsReady() && status < 1;
                    if (unit.GetIdentity() == 1) {
                        this._bankerIndex = index;
                        if (this._niuStory.isReConnected && this._curStatus > MAP_STATUS.PLAY_STATUS_GET_BANKER && this._bankerRateList[index]) {
                            this._playerList[index].box_bankerRate.visible = true;
                            this._playerList[index].box_notBet.visible = false;
                            this._playerList[index].img_bankerRate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "bei_{0}.png", this._bankerRateList[index]);
                            this._playerList[index].view_icon.img_banker.visible = true;
                            this._playerList[index].view_icon.img_banker.ani1.play(0, false);
                        }
                        if (unit.GetIndex() == idx)
                            this._viewUI.box_betRate.visible = false;
                    } else {
                        if (this._niuStory.isReConnected && this._curStatus > MAP_STATUS.PLAY_STATUS_GET_BANKER) {
                            this._playerList[index].box_bankerRate.visible = false;
                            this._playerList[index].box_notBet.visible = false;
                        }
                    }
                    //头像框
                    this._playerList[index].view_icon.img_txk.visible = unit.GetVipLevel() > 0;
                    if (this._playerList[index].view_icon.img_txk.visible) {
                        this._playerList[index].view_icon.img_txk.skin = PathGameTongyong.ui_tongyong_touxiang + "tu_v" + unit.GetVipLevel() + ".png";
                    }
                    //祈福成功 头像上就有动画
                    if (qifu_index && posIdx == qifu_index) {
                        this._playerList[index].view_icon.qifu_type.visible = true;
                        this._playerList[index].view_icon.qifu_type.skin = this._qifuTypeImgUrl;
                        this.playTween(this._playerList[index].view_icon.qifu_type, qifu_index);
                    }
                    //时间戳变化 才加上祈福标志
                    if (unit.GetQiFuEndTime() > this._game.sync.serverTimeBys) {
                        if (qifu_index && posIdx == qifu_index) {
                            Laya.timer.once(2500, this, () => {
                                this._playerList[index].view_icon.img_qifu.visible = true;
                                if (this._playerList[index].view_icon.img_qifu.visible && unit.GetQiFuType()) {
                                    this._playerList[index].view_icon.img_icon.skin = PathGameTongyong.ui_tongyong_touxiang + "head_" + this._nameStrInfo[unit.GetQiFuType() - 1] + ".png";
                                }
                            })
                        } else {
                            this._playerList[index].view_icon.img_qifu.visible = true;
                            if (this._playerList[index].view_icon.img_qifu.visible && unit.GetQiFuType()) {
                                this._playerList[index].view_icon.img_icon.skin = PathGameTongyong.ui_tongyong_touxiang + "head_" + this._nameStrInfo[unit.GetQiFuType() - 1] + ".png";
                            }
                        }
                    } else {
                        this._playerList[index].view_icon.img_qifu.visible = false;
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
            this.count = 0;
            Laya.timer.loop(150, this, this.ranEffPos);
            this.ranEffPos();
        }

        private count: number = 0;
        private curIndex: number = 0;
        private ranEffPos(): void {
            if (!this._game.mainScene || !this._game.mainScene.camera) return;
            if (this.curIndex >= this._bankerList.length) {
                this.curIndex = 0;
            }
            let randIndex = this.getUnitUIPos(this._bankerList[this.curIndex]);
            let posX = this._game.mainScene.camera.getScenePxByCellX(this._playerList[randIndex].x + this._playerList[randIndex].view_icon.x - 26);
            let posY = this._game.mainScene.camera.getScenePxByCellY(this._playerList[randIndex].y + this._playerList[randIndex].view_icon.y - 23);
            this._kuangView.pos(posX, posY);
            this._game.playSound(Path_game_rniuniu.music_niuniu + "suiji.mp3", false);
            if (randIndex == this._bankerIndex) {
                if (this.count >= 25) {
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
            this.curIndex++;
            this.count++;
        }

        //下注倍数按钮更新
        private onUpdateBetBtn(a: number, b: number, c: number) {
            let bankerMoney = a;
            let playerMoney = this._game.sceneObjectMgr.mainPlayer.playerInfo.money;
            let bankerRate = b;
            let base = c;
            let maxBetRate = Math.round(Math.min(bankerMoney / (9 * bankerRate * base), playerMoney / (bankerRate * base)));
            maxBetRate = maxBetRate > 15 ? 15 : maxBetRate == 0 ? 1 : maxBetRate;
            if (this.isCardRoomType) maxBetRate = 15;
            this._betList = RATE_LIST[maxBetRate.toString()]
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
            //不是房卡模式，就不用算
            if (!this.isCardRoomType) return;
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
                    this._playerList[index].img_bankerRate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "bei_{0}.png", this._bankerRateList[index]);
                }
            } else {
                this._playerList[index].box_notBet.visible = !flag;
                this._playerList[index].box_bankerRate.visible = flag;
                this._playerList[index].img_bankerRate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "bei_{0}.png", info.BetVal);
            }
        }

        private onBattleBet(info: any): void {
            let index = this.getUnitUIPos(info.SeatIndex);
            this._playerList[index].box_betRate.visible = true;
            this._betTemps[info.SeatIndex - 1] = info.BetVal;
            this.setBetRate(index, info.BetVal);
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
                this._viewUI.box_showCard.visible = true;
                this._viewUI.box_typeNiu.box_notNiu.visible = cardType == 0;
                this._viewUI.box_bigNiu.visible = cardType > 7;
                this._viewUI.box_typeNiu.box_niu.visible = cardType > 0;
                this._viewUI.box_bigNiu.ani1.play(0, false);
                cardType > 0 && this._viewUI.box_typeNiu.ani1.play(0, false);
                this._game.playSound(Path_game_rniuniu.music_niuniu + "" + StringU.substitute("niu{0}_{1}.mp3", cardType, sex), false);
            })
            if (cardType >= 10) {
                this._viewUI.box_typeNiu.img_type.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                this._viewUI.box_typeNiu.img_x.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz1_x.png");
                this._viewUI.box_typeNiu.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz1_{0}.png", this._niuMgr.checkCardsRate(cardType));
            } else {
                this._viewUI.box_typeNiu.img_type.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                this._viewUI.box_typeNiu.img_x.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_x.png");
                this._viewUI.box_typeNiu.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
            }
        }

        //显示主玩家牌型（断线重连）
        private reShowMainCardType(i: number, cardType: number, sex: number): void {
            this._viewUI.img_yiwancheng.visible = false;
            this._viewUI.box_showCard.visible = true;
            this._viewUI.box_typeNiu.box_notNiu.visible = cardType == 0;
            this._viewUI.box_bigNiu.visible = cardType > 7;
            this._viewUI.box_typeNiu.box_niu.visible = cardType > 0;
            this._viewUI.box_bigNiu.ani1.play(0, false);
            cardType > 0 && this._viewUI.box_typeNiu.ani1.play(0, false);
            this._game.playSound(Path_game_rniuniu.music_niuniu + "" + StringU.substitute("niu{0}_{1}.mp3", cardType, sex), false);
            if (cardType >= 10) {
                this._viewUI.box_typeNiu.img_type.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                this._viewUI.box_typeNiu.img_x.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz1_x.png");
                this._viewUI.box_typeNiu.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz1_{0}.png", this._niuMgr.checkCardsRate(cardType));
            } else {
                this._viewUI.box_typeNiu.img_type.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                this._viewUI.box_typeNiu.img_x.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_x.png");
                this._viewUI.box_typeNiu.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
            }
        }

        //显示其他玩家牌型
        private showOtherCardType(curIndex: number, i: number, cardType: number, sex: number): void {
            this._playerList[curIndex].img_yiwancheng.visible = false;
            Laya.timer.once(1000 + 1000 * i, this, () => {
                this._playerList[curIndex].box_cardType.visible = true;
                this._playerList[curIndex].box_typeNiu.box_notNiu.visible = cardType == 0;
                this._playerList[curIndex].box_bigNiu.visible = cardType > 7;
                this._playerList[curIndex].box_typeNiu.box_niu.visible = cardType > 0;
                this._playerList[curIndex].box_bigNiu.ani1.play(0, false);
                cardType > 0 && this._playerList[curIndex].box_typeNiu.ani1.play(0, false);
                this._game.playSound(Path_game_rniuniu.music_niuniu + "" + StringU.substitute("niu{0}_{1}.mp3", cardType, sex), false);
            })
            if (cardType >= 10) {
                this._playerList[curIndex].box_typeNiu.img_type.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                this._playerList[curIndex].box_typeNiu.img_x.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz1_x.png");
                this._playerList[curIndex].box_typeNiu.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz1_{0}.png", this._niuMgr.checkCardsRate(cardType));
            } else {
                this._playerList[curIndex].box_typeNiu.img_type.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                this._playerList[curIndex].box_typeNiu.img_x.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_x.png");
                this._playerList[curIndex].box_typeNiu.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
            }
        }

        //显示其他玩家牌型（断线重连）
        private reShowOtherCardType(curIndex: number, i: number, cardType: number, sex: number): void {
            this._playerList[curIndex].img_yiwancheng.visible = false;
            this._playerList[curIndex].box_cardType.visible = true;
            this._playerList[curIndex].box_typeNiu.box_notNiu.visible = cardType == 0;
            this._playerList[curIndex].box_bigNiu.visible = cardType > 7;
            this._playerList[curIndex].box_typeNiu.box_niu.visible = cardType > 0;
            this._playerList[curIndex].box_bigNiu.ani1.play(0, false);
            cardType > 0 && this._playerList[curIndex].box_typeNiu.ani1.play(0, false);
            this._game.playSound(Path_game_rniuniu.music_niuniu + "" + StringU.substitute("niu{0}_{1}.mp3", cardType, sex), false);
            if (cardType >= 10) {
                this._playerList[curIndex].box_typeNiu.img_type.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                this._playerList[curIndex].box_typeNiu.img_x.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz1_x.png");
                this._playerList[curIndex].box_typeNiu.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz1_{0}.png", this._niuMgr.checkCardsRate(cardType));
            } else {
                this._playerList[curIndex].box_typeNiu.img_type.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "n_{0}.png", cardType);
                this._playerList[curIndex].box_typeNiu.img_x.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_x.png");
                this._playerList[curIndex].box_typeNiu.img_rate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "sz_{0}.png", this._niuMgr.checkCardsRate(cardType));
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
            valueClip.scale(0.8, 0.8);
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
            this._playerList[i].img_betRate1.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "bei_{0}.png", num1);
            this._playerList[i].img_betRate2.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "bei_{0}.png", num2);
        }

        //更新地图状态
        private onUpdateStatus() {
            if (!this._niuMapInfo) return;
            if (this._curStatus == this._niuMapInfo.GetMapState()) return;
            this._curStatus = this._niuMapInfo.GetMapState();
            this._viewUI.btn_continue.visible = this._curStatus == MAP_STATUS.PLAY_STATUS_SHOW_GAME && !this.isCardRoomType;
            this._viewUI.box_bankerRate.visible = this._curStatus == MAP_STATUS.PLAY_STATUS_GET_BANKER;
            if (this._curStatus == MAP_STATUS.PLAY_STATUS_SET_BANKER || this._curStatus == MAP_STATUS.PLAY_STATUS_GAME_START || this._curStatus == MAP_STATUS.PLAY_STATUS_PUSH_CARD
                || this._curStatus == MAP_STATUS.PLAY_STATUS_COMPARE || this._curStatus == MAP_STATUS.PLAY_STATUS_SETTLE || this._curStatus == MAP_STATUS.PLAY_STATUS_GAME_SHUFFLE) {
                this._viewUI.box_timer.visible = false;
            }
            if (this._curStatus > MAP_STATUS.PLAY_STATUS_GAME_NONE && this._curStatus < MAP_STATUS.PLAY_STATUS_SHOW_GAME) {
                this._pageHandle.pushClose({ id: TongyongPageDef.PAGE_TONGYONG_MATCH, parent: this._game.uiRoot.HUD });
            }
            if (this._curStatus != MAP_STATUS.PLAY_STATUS_MATCH_POINT) {
                this._viewUI.box_matchPoint.visible = false;
            }
            this._isPlaying = this._curStatus >= MAP_STATUS.PLAY_STATUS_GAME_SHUFFLE && this._curStatus < MAP_STATUS.PLAY_STATUS_SHOW_GAME;
            //房卡按钮屏蔽
            this._viewUI.view_card.visible = this._curStatus == MAP_STATUS.PLAY_STATUS_CARDROOM_CREATED || this._curStatus == MAP_STATUS.PLAY_STATUS_CARDROOM_WAIT;
            this._viewUI.text_cardroomid.visible = this._curStatus == MAP_STATUS.PLAY_STATUS_CARDROOM_CREATED || this._curStatus == MAP_STATUS.PLAY_STATUS_CARDROOM_WAIT;
            switch (this._curStatus) {
                case MAP_STATUS.PLAY_STATUS_GAME_NONE:// 准备阶段
                    this.initRoomConfig();
                    break;
                case MAP_STATUS.PLAY_STATUS_GAME_SHUFFLE:// 洗牌阶段
                    if (this.isCardRoomType) {
                        this._pageHandle.pushClose({ id: RniuniuPageDef.PAGE_NIUNIU_CARDROOM_SETTLE, parent: this._game.uiRoot.HUD });
                        this.clearClips();
                        this.resetUI();
                        this.resetData();
                        this._game.sceneObjectMgr.clearOfflineObject();
                    }
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
                    this._pageHandle.pushOpen({ id: RniuniuPageDef.PAGE_NIUNIU_BEGIN, parent: this._game.uiRoot.HUD });
                    this._game.playSound(Path_game_rniuniu.music_niuniu + "kaishi.mp3", false);
                    this._viewUI.box_tips.visible = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_GET_BANKER:// 开始抢庄
                    this._pageHandle.pushClose({ id: RniuniuPageDef.PAGE_NIUNIU_BEGIN, parent: this._game.uiRoot.HUD });
                    this._viewUI.txt_status.text = "开始抢庄";
                    break;
                case MAP_STATUS.PLAY_STATUS_SET_BANKER:// 定庄阶段
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_BET:// 下注阶段
                    Laya.timer.clear(this, this.ranEffPos);
                    this._kuangView.removeSelf();
                    for (let i: number = 0; i < RniuniuMgr.MAX_NUM; i++) {
                        if (this._bankerIndex == i) {
                            if (this._playerList[i].box_notBet.visible) {
                                this._playerList[i].box_bankerRate.visible = true;
                                this._playerList[i].box_notBet.visible = false;
                                this._playerList[i].img_bankerRate.skin = StringU.substitute(Path_game_rniuniu.ui_niuniu + "bei_1.png");
                            }
                        } else {
                            this._playerList[i].box_bankerRate.visible = false;
                            this._playerList[i].box_notBet.visible = false;
                        }
                    }
                    this._viewUI.box_betRate.visible = this._bankerIndex != 0;
                    this._viewUI.txt_status.text = "开始下注";
                    break;
                case MAP_STATUS.PLAY_STATUS_PUSH_CARD:// 发牌阶段
                    this._viewUI.paixie.ani2.play(0, true);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_MATCH_POINT:// 配牛阶段
                    this._viewUI.box_btn.visible = true;
                    this._viewUI.box_matchPoint.visible = true;
                    this._niuMgr.isReKaiPai = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_COMPARE:// 比牌阶段
                    this._viewUI.txt_status.text = "比牌中";
                    this._viewUI.box_btn.visible = false;
                    this._viewUI.box_tips.visible = false;
                    this._viewUI.box_xinshou.visible = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_SETTLE:// 结算阶段
                    this._viewUI.txt_status.text = "结算中";
                    this._viewUI.box_tips.visible = false;
                    this._viewUI.box_matchPoint.visible = false;
                    this.addBankerWinEff();
                    let timeInternal = MONEY_NUM * MONEY_FLY_TIME;
                    Laya.timer.once(timeInternal, this, () => {
                        this.addBankerLoseEff();
                        this.updateMoney();
                    });
                    Laya.timer.once(2000, this, () => {
                        if (this._bankerLoseInfo.length == 2) {//庄家通杀
                            this._game.playSound(Path_game_rniuniu.music_niuniu + "zjtongchi.mp3", false);
                            this._game.uiRoot.HUD.open(RniuniuPageDef.PAGE_NIUNIU_TONGSHA);
                        }
                        else if (this._mainPlayerBenefit > 0) {
                            let rand = MathU.randomRange(1, 3);
                            this._game.playSound(StringU.substitute(PathGameTongyong.music_tongyong + "win{0}.mp3", rand), true);
                            this._game.uiRoot.HUD.open(RniuniuPageDef.PAGE_NIUNIU_WIN);
                        } else {
                            let rand = MathU.randomRange(1, 4);
                            this._game.playSound(StringU.substitute(PathGameTongyong.music_tongyong + "lose{0}.mp3", rand), true);
                            this._game.uiRoot.HUD.open(RniuniuPageDef.PAGE_NIUNIU_LOSE);
                        }
                    });

                    break;
                case MAP_STATUS.PLAY_STATUS_SETTLE_INFO:// 显示结算信息
                    this.openCardSettlePage();
                    this._niuStory.isReConnected = false;
                    break;
                case MAP_STATUS.PLAY_STATUS_SHOW_GAME:// 本局展示阶段
                    if (this.isCardRoomType && this._niuMapInfo.GetRound() == this._niuMapInfo.GetCardRoomGameNumber()) {
                        this.openCardSettlePage();
                    }
                    this._pageHandle.pushClose({ id: RniuniuPageDef.PAGE_NIUNIU_TONGSHA, parent: this._game.uiRoot.HUD });
                    if (this._game.sceneObjectMgr.mainPlayer.playerInfo.money < this._room_config[1]) {
                        TongyongPageDef.ins.alertRecharge(StringU.substitute("老板，您的金币少于{0}哦~\n补充点金币去大杀四方吧~", this._room_config[1]), () => {
                            this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
                        }, () => {
                        }, true, TongyongPageDef.TIPS_SKIN_STR["cz"]);
                    }

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
                            betRate: betNum ? "" + betNum : "",
                            bankerRate: identity == 1 ? this._bankerRate == 0 ? "1" : "" + this._bankerRate : "",
                            jiFen: EnumToString.getPointBackNum(jifen, 2),
                            totalJiFen: EnumToString.getPointBackNum(totalJiFen, 2),
                            cardtype: cardType,
                        }
                        temps.push(obj);
                    }
                }
            }
            infoTemps.push(this._niuMapInfo.GetRound());
            infoTemps.push(this._niuMapInfo.GetCardRoomGameNumber());
            infoTemps.push(this._niuMapInfo.GetCountDown());
            infoTemps.push(temps);
            this._pageHandle.pushOpen({ id: RniuniuPageDef.PAGE_NIUNIU_CARDROOM_SETTLE, dataSource: infoTemps, parent: this._game.uiRoot.HUD });
        }

        //按钮缓动回调
        protected onBtnTweenEnd(e: any, target: any): void {
            switch (target) {
                case this._viewUI.btn_spread://菜单
                    this.showMenu(true);
                    break;
                case this._viewUI.btn_cardType://牌型
                    this._game.uiRoot.general.open(RniuniuPageDef.PAGE_NIUNIU_RULE, (page: RniuniuRulePage) => {
                        page.dataSource = 1;
                    });
                    break;
                case this._viewUI.btn_rule://规则
                    this._game.uiRoot.general.open(RniuniuPageDef.PAGE_NIUNIU_RULE);
                    break;
                case this._viewUI.btn_chongzhi://充值
                    this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
                    break;
                case this._viewUI.btn_set://设置
                    this._game.uiRoot.general.open(TongyongPageDef.PAGE_TONGYONG_SETTING)
                    break;
                case this._viewUI.btn_niu://有牛
                    if (!this._viewUI.txt_pointTotal.text) {
                        this._game.uiRoot.topUnder.showTips("拼牌错误");
                        return;
                    }
                    if (parseInt(this._viewUI.txt_pointTotal.text) % 10 != 0) {
                        this._game.uiRoot.topUnder.showTips("拼牌错误");
                        return;
                    }
                    this._game.playSound(Path_game_rniuniu.music_niuniu + "pingpaiwancheng.mp3", false);
                    this._niuMgr.gaipai();
                    this._niuStory.isGaiPai = true;
                    this._game.network.call_niuniu_pinpai();
                    this._viewUI.box_matchPoint.visible = false;
                    this._viewUI.box_btn.visible = false;
                    this._viewUI.box_xinshou.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家拼牌";
                    break;
                case this._viewUI.btn_notNiu://没牛
                    let type = this._niuMgr.checkMyCards();
                    if (type) {
                        this._game.uiRoot.topUnder.showTips("拼牌错误");
                        return;
                    }
                    this._game.playSound(Path_game_rniuniu.music_niuniu + "pingpaiwancheng.mp3", false);
                    this._niuMgr.gaipai();
                    this._niuStory.isGaiPai = true;
                    this._game.network.call_niuniu_pinpai();
                    this._viewUI.box_matchPoint.visible = false;
                    this._viewUI.box_btn.visible = false;
                    this._viewUI.box_xinshou.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家拼牌";
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
                    this._game.uiRoot.general.open(TongyongPageDef.PAGE_TONGYONG_QIFU);
                    break;
                case this._viewUI.btn_back://返回
                    if (this.isCardRoomType) {
                        if (!this.canEndCardGame()) return;
                        if (this._niuStory.isCardRoomMaster()) {
                            this.masterDismissCardGame();
                            return;
                        }
                    } else {
                        if (this._niuMapInfo && this._niuMapInfo.GetPlayState() == 1) {
                            this._game.showTips("游戏尚未结束，请先打完这局哦~");
                            return;
                        }
                    }
                    this.clearClips();
                    this.resetData();
                    this.clearMapInfoListen();
                    this._game.sceneObjectMgr.leaveStory(true);
                    logd("玩家发送离开地图协议，离开房间")
                    // this.close();
                    break;
                case this._viewUI.btn_continue://继续游戏
                    if (this._game.sceneObjectMgr.mainUnit) {
                        if (this._game.sceneObjectMgr.mainUnit.GetMoney() < this._room_config[1]) {
                            TongyongPageDef.ins.alertRecharge(StringU.substitute("老板，您的金币少于{0}哦~\n补充点金币去大杀四方吧~", this._room_config[1]), () => {
                                this._game.uiRoot.general.open(DatingPageDef.PAGE_CHONGZHI);
                            }, () => {
                            }, true, TongyongPageDef.TIPS_SKIN_STR["cz"]);
                            return;
                        }
                    }

                    if (this._niuMapInfo instanceof MapInfo) {
                        this.clearClips();
                        this.resetUI();
                        this.resetData();
                        this._game.sceneObjectMgr.leaveStory();
                        logd("玩家发送离开地图协议")

                    } else {
                        this.onUpdateMapInfo();
                    }
                    break;
                case this._viewUI.btn_bankerRate0://不抢庄
                    this._game.network.call_niuniu_banker(0);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家抢庄";
                    break;
                case this._viewUI.btn_bankerRate1://抢庄倍数1
                    this._game.network.call_niuniu_banker(1);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家抢庄";
                    break;
                case this._viewUI.btn_bankerRate2://抢庄倍数2
                    this._game.network.call_niuniu_banker(2);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家抢庄";
                    break;
                case this._viewUI.btn_bankerRate3://抢庄倍数3
                    this._game.network.call_niuniu_banker(3);
                    this._viewUI.box_bankerRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家抢庄";
                    break;
                case this._viewUI.btn_betRate1://下注倍数1
                    this._game.network.call_niuniu_bet(this._betList[0]);
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家下注";
                    break;
                case this._viewUI.btn_betRate2://下注倍数2
                    this._game.network.call_niuniu_bet(this._betList[1]);
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家下注";
                    break;
                case this._viewUI.btn_betRate3://下注倍数3
                    this._game.network.call_niuniu_bet(this._betList[2]);
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家下注";
                    break;
                case this._viewUI.btn_betRate4://下注倍数4
                    this._game.network.call_niuniu_bet(this._betList[3]);
                    this._viewUI.box_betRate.visible = false;
                    this._viewUI.box_tips.visible = true;
                    this._viewUI.txt_tips.text = "等待其他玩家下注";
                    break;
                case this._viewUI.view_card.btn_invite://房卡邀请
                    // 微信邀请玩家参与房卡游戏
                    logd("btn_invite:", this._niuMapInfo.GetCardRoomId());
                    if (this.isCardRoomType && this._niuMapInfo.GetCardRoomId()) {
                        this._game.network.call_get_roomcard_share(RniuniuPageDef.GAME_NAME);
                    }
                    break;
                case this._viewUI.view_card.btn_dismiss://房卡解散
                    this.masterDismissCardGame();
                    break;
                case this._viewUI.view_card.btn_start:////房卡开始
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
                this._viewUI.txt_round.visible = true;
                this._viewUI.txt_round.text = StringU.substitute("局数：{0}/{1}", this._niuMapInfo.GetRound(), this._niuMapInfo.GetCardRoomGameNumber());
            } else {
                this._viewUI.txt_round.visible = false;
            }
        }

        private onUpdateGameNo(): void {
            if (!this._niuMapInfo) return;
            if (this._niuMapInfo.GetGameNo()) {
                this._viewUI.box_id.visible = true;
                this._viewUI.txt_id.text = "牌局号：" + this._niuMapInfo.GetGameNo();
                // if (this.isCardRoomType)
                //     this._viewUI.txt_id.text = "房间号：" + this._niuMapInfo.GetCardRoomId();
            }
        }

        private _nameStrInfo: string[] = ["xs", "px", "gsy", "gg", "cs", "tdg"];
        private _qifuTypeImgUrl: string;
        protected onOptHandler(optcode: number, msg: any) {
            if (msg.type == Operation_Fields.OPRATE_GAME) {
                switch (msg.reason) {
                    case Operation_Fields.OPRATE_GAME_QIFU_SUCCESS_RESULT:
                        let dataInfo = JSON.parse(msg.data);
                        //打开祈福动画界面
                        this._game.uiRoot.general.open(TongyongPageDef.PAGE_TONGYONG_QIFU_ANI, (page) => {
                            page.dataSource = StringU.substitute(PathGameTongyong.ui_tongyong_qifu + "f_{0}1.png", this._nameStrInfo[dataInfo.qf_id - 1]);
                        });
                        //相对应的玩家精灵做出反应
                        this._qifuTypeImgUrl = StringU.substitute(PathGameTongyong.ui_tongyong_qifu + "f_{0}2.png", this._nameStrInfo[dataInfo.qf_id - 1]);
                        this.onUpdateUnit(dataInfo.qifu_index);
                        break;
                }
            }
            else if (msg.type == Operation_Fields.OPRATE_TELEPORT) {
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
            this._viewUI.box_status.visible = false;
            this._viewUI.box_bankerRate.visible = false;
            this._viewUI.box_betRate.visible = false;
            this._viewUI.box_timer.visible = false;
            this._viewUI.box_xinshou.visible = false;
            this._viewUI.box_id.visible = false;
            this._viewUI.xipai.visible = false;
            this._viewUI.paixie.ani2.gotoAndStop(0);
            this._viewUI.paixie.cards.visible = false;
            this._viewUI.paixie.ani_chupai.stop();
            this._viewUI.box_menu.visible = false;
            this._viewUI.box_menu.zOrder = 99;
            this._viewUI.txt_round.visible = false;

            this._playerList = [];
            for (let i: number = 0; i < RniuniuMgr.MAX_NUM; i++) {
                this._playerList.push(this._viewUI["view" + i])
            }
            for (let i: number = 0; i < RniuniuMgr.MAX_NUM; i++) {
                this._playerList[i].visible = false;
                this._playerList[i].box_bankerRate.visible = false;
                this._playerList[i].box_betRate.visible = false;
                this._playerList[i].box_notBet.visible = false;
                this._playerList[i].img_isReady.visible = false;
                this._playerList[i].view_icon.clip_money.visible = false;
                this._playerList[i].view_icon.img_banker.visible = false;
                if (i > 0) {
                    this._playerList[i].box_cardType.visible = false;
                    this._playerList[i].img_yiwancheng.visible = false;
                }
            }

            //主玩家UI
            this._viewUI.box_showCard.visible = false;
            this._viewUI.box_btn.visible = false;
            this._viewUI.box_matchPoint.visible = false;
            this._viewUI.img_yiwancheng.visible = false;
            this._viewUI.txt_point0.text = "";
            this._viewUI.txt_point1.text = "";
            this._viewUI.txt_point2.text = "";
            this._viewUI.txt_pointTotal.text = "";
            this._viewUI.btn_continue.visible = false;
        }

        private initRoomConfig(): void {
            if (this._niuStory.maplv) {
                this._room_config = ROOM_CONFIG[this._niuStory.maplv];
                let str = "";
                if (this._niuStory.maplv == Web_operation_fields.GAME_ROOM_CONFIG_QIANGZHUANG_NIUNIU_1) {
                    str = "房间：新手场  底注：";
                } else if (this._niuStory.maplv == Web_operation_fields.GAME_ROOM_CONFIG_QIANGZHUANG_NIUNIU_2) {
                    str = "房间：小资场  底注：";
                } else if (this._niuStory.maplv == Web_operation_fields.GAME_ROOM_CONFIG_QIANGZHUANG_NIUNIU_3) {
                    str = "房间：老板场  底注：";
                } else if (this._niuStory.maplv == Web_operation_fields.GAME_ROOM_CONFIG_QIANGZHUANG_NIUNIU_4) {
                    str = "房间：富豪场  底注：";
                } else if (this._niuStory.maplv == Web_operation_fields.GAME_ROOM_CONFIG_CARD_ROOM) {
                    str = "房卡模式  底注：";
                }
                this._viewUI.txt_base.text = str + this._room_config[0];
                if (this._niuStory.maplv != Web_operation_fields.GAME_ROOM_CONFIG_CARD_ROOM) {
                    let playerMoney = this._game.sceneObjectMgr.mainPlayer.playerInfo.money;
                    this._viewUI.btn_bankerRate1.disabled = !(playerMoney >= this._room_config[0] * 30);
                    this._viewUI.btn_bankerRate2.disabled = !(playerMoney >= this._room_config[0] * 60);
                    this._viewUI.btn_bankerRate3.disabled = !(playerMoney >= this._room_config[0] * 90);
                }
            }
        }

        //重置UI
        private resetUI(): void {
            for (let i: number = 0; i < RniuniuMgr.MAX_NUM; i++) {
                this._playerList[i].box_bankerRate.visible = false;
                this._playerList[i].box_betRate.visible = false;
                this._playerList[i].box_notBet.visible = false;
                this._playerList[i].img_isReady.visible = false;
                this._playerList[i].view_icon.clip_money.visible = false;
                this._playerList[i].view_icon.img_banker.visible = false;
                if (i > 0) {
                    if (!this.isCardRoomType) {
                        this._playerList[i].visible = false;
                    }
                    this._playerList[i].box_cardType.visible = false;
                    this._playerList[i].img_yiwancheng.visible = false;
                }
            }

            //主玩家UI
            this._viewUI.box_showCard.visible = false;
            this._viewUI.box_btn.visible = false;
            this._viewUI.box_matchPoint.visible = false;
            this._viewUI.img_yiwancheng.visible = false;
            this._viewUI.txt_point0.text = "";
            this._viewUI.txt_point1.text = "";
            this._viewUI.txt_point2.text = "";
            this._viewUI.txt_pointTotal.text = "";
            this._viewUI.btn_continue.visible = false;

            //界面UI
            this._viewUI.box_tips.visible = false;
            this._viewUI.box_bankerRate.visible = false;
            this._viewUI.box_betRate.visible = false;
            this._viewUI.box_timer.visible = false;
            this._viewUI.box_xinshou.visible = false;
            this._viewUI.paixie.cards.visible = false;
            this._viewUI.paixie.ani_chupai.stop();
            if (!this.isCardRoomType) {
                this._viewUI.box_id.visible = false;
            }
        }

        private resetData(): void {
            //不是房卡模式，才会去设置
            if (!this.isCardRoomType) {
                this._battleIndex = -1;
            }
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
                this._viewUI.btn_cardType.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_back.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_rule.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_chongzhi.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_set.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_continue.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_bankerRate0.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_bankerRate1.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_bankerRate2.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_bankerRate3.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_betRate1.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_betRate2.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_betRate3.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_betRate4.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_niu.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_notNiu.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_zhanji.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.view_card.btn_start.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.view_card.btn_invite.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.view_card.btn_dismiss.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._viewUI.btn_qifu.off(LEvent.CLICK, this, this.onBtnClickWithTween);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_OPRATE_SUCESS, this, this.onSucessHandler);
                this._viewUI.xipai.ani_xipai.off(LEvent.COMPLETE, this, this.onWashCardOver);
                this._game.mainScene.off(SceneOperator.AVATAR_MOUSE_CLICK_HIT, this, this.onUpdatePoint);
                if (this._niuMgr) {
                    this._niuMgr.off(RniuniuMgr.DEAL_OVER, this, this.onUpdateAniDeal);
                }

                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_STATUS_CHECK, this, this.onUpdateStatus);
                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_BATTLE_CHECK, this, this.onUpdateBattle);
                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_GAME_ROUND_CHANGE, this, this.onUpdateUnit);//继续游戏状态改变后
                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_GAME_NO, this, this.onUpdateGameNo);//牌局号
                this._game.sceneObjectMgr.off(RniuniuMapInfo.EVENT_COUNT_DOWN, this, this.onUpdateCountDown);//倒计时更新

                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_ADD_UNIT, this, this.onUnitAdd);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_REMOVE_UNIT, this, this.onUnitRemove);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_MONEY_CHANGE, this, this.onUpdateUnit);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_CHANGE, this, this.onUpdateUnit);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_ACTION, this, this.onUpdateUnit);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_MAPINFO_CHANGE, this, this.onUpdateMapInfo);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_MAIN_UNIT_CHANGE, this, this.updateCardRoomDisplayInfo);
                this._game.sceneObjectMgr.off(SceneObjectMgr.EVENT_UNIT_QIFU_TIME_CHANGE, this, this.onUpdateUnit);

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