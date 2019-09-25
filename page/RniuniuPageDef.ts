/**
* name 
*/
module gamerniuniu.page {
	export class RniuniuPageDef extends game.gui.page.PageDef {
		static GAME_NAME: string;
		//牛牛地图UI
		static PAGE_NIUNIU_MAP: string = "1";

		//房卡系列
		static PAGE_NIUNIU_CREATE_CARDROOM: string = "7";	// 创建房间
		static PAGE_NIUNIU_CARDROOM_SETTLE: string = "8";	// 房卡结算页
		static PAGE_NIUNIU_JOIN_CARDROOM: string = "100";	// 加入房间
		//牛牛游戏规则界面
		static PAGE_NIUNIU_RULE: string = "101";

		static myinit(str: string) {
			super.myinit(str);
			RniuniuClip.init();
			PageDef._pageClassMap[RniuniuPageDef.PAGE_NIUNIU_MAP] = RNiuNiuMapPage;
			PageDef._pageClassMap[RniuniuPageDef.PAGE_NIUNIU_RULE] = RniuniuRulePage;
			PageDef._pageClassMap[RniuniuPageDef.PAGE_NIUNIU_CREATE_CARDROOM] = RniuniuCreateCardRoom;
			PageDef._pageClassMap[RniuniuPageDef.PAGE_NIUNIU_JOIN_CARDROOM] = RniuniuJoinCardRoom;
			PageDef._pageClassMap[RniuniuPageDef.PAGE_NIUNIU_CARDROOM_SETTLE] = RniuniuSettlePage;


			this["__needLoadAsset"] = [
				Path_game_rniuniu.atlas_game_ui + "rniuniu.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "pai.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "general.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "touxiang.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "qz.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "fk.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "general/effect/suiji.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "general/effect/fapai_1.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "general/effect/xipai.atlas",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_0.png",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_0.sk",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_1.png",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_1.sk",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_2.png",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_2.sk",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_3.png",
				Path_game_rniuniu.ui_niuniu + "sk/qznn_3.sk",

				PathGameTongyong.atlas_game_ui_tongyong + "jiaru.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
				PathGameTongyong.atlas_game_ui_tongyong + "logo.atlas",
				Path.custom_atlas_scene + 'card.atlas',
				Path.map + 'pz_rniuniu.png',
				Path.map_far + 'bg_rniuniu.jpg',
			]

			if (WebConfig.needMusicPreload) {
				this["__needLoadAsset"] = this["__needLoadAsset"].concat([
					Path_game_rniuniu.music_niuniu + "nn_bgm.mp3",
					Path_game_rniuniu.music_niuniu + "dianjipai.mp3",
					Path_game_rniuniu.music_niuniu + "gaipai.mp3",
					Path_game_rniuniu.music_niuniu + "kaishi.mp3",
					Path_game_rniuniu.music_niuniu + "niu0_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu0_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu1_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu1_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu2_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu2_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu3_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu3_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu4_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu4_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu5_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu5_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu6_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu6_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu7_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu7_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu8_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu8_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu9_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu9_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu10_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu10_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu11_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu11_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu12_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu12_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu13_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu13_2.mp3",
					Path_game_rniuniu.music_niuniu + "niu14_1.mp3",
					Path_game_rniuniu.music_niuniu + "niu14_2.mp3",
					Path_game_rniuniu.music_niuniu + "piaoqian.mp3",
					Path_game_rniuniu.music_niuniu + "pingpaiwancheng.mp3",
					Path_game_rniuniu.music_niuniu + "shengli.mp3",
					Path_game_rniuniu.music_niuniu + "shibai.mp3",
					Path_game_rniuniu.music_niuniu + "suidao.mp3",
					Path_game_rniuniu.music_niuniu + "suiji.mp3",
					Path_game_rniuniu.music_niuniu + "zjtongchi.mp3",
				])
			}
		}
	}
}