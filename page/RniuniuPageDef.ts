/**
* name 
*/
module gamerniuniu.page {
	export class RniuniuPageDef extends game.gui.page.PageDef {
		static GAME_NAME: string;
		//牛牛地图UI
		static PAGE_RNIUNIU_MAP: string = "2";

		//房卡系列
		static PAGE_RNIUNIU_CARDROOM_SETTLE: string = "3";	// 房卡结算页
		//牛牛游戏规则界面
		static PAGE_RNIUNIU_RULE: string = "101";

		static myinit(str: string) {
			super.myinit(str);
			RniuniuClip.init();
			PageDef._pageClassMap[RniuniuPageDef.PAGE_RNIUNIU_MAP] = RNiuNiuMapPage;
			PageDef._pageClassMap[RniuniuPageDef.PAGE_RNIUNIU_RULE] = RniuniuRulePage;
			PageDef._pageClassMap[RniuniuPageDef.PAGE_RNIUNIU_CARDROOM_SETTLE] = RniuniuSettlePage;


			this["__needLoadAsset"] = [
				DatingPath.atlas_dating_ui + "qifu.atlas",
                Path_game_rniuniu.atlas_game_ui + "rniuniu.atlas",
                Path_game_rniuniu.atlas_game_ui + "rniuniu/qp.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "qifu.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "hud.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "pai.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "general.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "touxiang.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "dating.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "qz.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "fk.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "chongzhi.atlas",
                PathGameTongyong.atlas_game_ui_tongyong + "nyl.atlas",
                PathGameTongyong.atlas_game_ui_tongyong_general + "effect/suiji.atlas",
                PathGameTongyong.atlas_game_ui_tongyong_general + "effect/fapai_1.atlas",
                PathGameTongyong.atlas_game_ui_tongyong_general + "effect/xipai.atlas",
                PathGameTongyong.atlas_game_ui_tongyong_general + "anniu.atlas",

				Path.custom_atlas_scene + 'card.atlas',
				Path.map + 'pz_rniuniu.png',
				Path.map_far + 'bg_rniuniu.jpg',
			]

			if (WebConfig.needMusicPreload) {
				this["__needLoadAsset"] = this["__needLoadAsset"].concat([
					Path_game_rniuniu.music_rniuniu + "nn_bgm.mp3",
					Path_game_rniuniu.music_rniuniu + "dianjipai.mp3",
					Path_game_rniuniu.music_rniuniu + "gaipai.mp3",
					Path_game_rniuniu.music_rniuniu + "kaishi.mp3",
					Path_game_rniuniu.music_rniuniu + "niu0_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu0_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu1_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu1_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu2_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu2_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu3_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu3_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu4_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu4_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu5_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu5_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu6_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu6_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu7_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu7_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu8_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu8_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu9_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu9_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu10_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu10_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu11_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu11_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu12_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu12_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu13_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu13_2.mp3",
					Path_game_rniuniu.music_rniuniu + "niu14_1.mp3",
					Path_game_rniuniu.music_rniuniu + "niu14_2.mp3",
					Path_game_rniuniu.music_rniuniu + "piaoqian.mp3",
					Path_game_rniuniu.music_rniuniu + "pingpaiwancheng.mp3",
					Path_game_rniuniu.music_rniuniu + "shengli.mp3",
					Path_game_rniuniu.music_rniuniu + "shibai.mp3",
					Path_game_rniuniu.music_rniuniu + "suidao.mp3",
					Path_game_rniuniu.music_rniuniu + "suiji.mp3",
					Path_game_rniuniu.music_rniuniu + "zjtongchi.mp3",
				])
			}
			this["__roomcard"] = Web_operation_fields.GAME_ROOM_CONFIG_CARD_ROOM;
		}
	}
}