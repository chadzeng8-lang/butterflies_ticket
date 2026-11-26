export type CharacterBio = {
  slug: string;
  name: string;
  /** 列表／卡片缩略图 */
  photo: string;
  /** 详情／灯箱高清图 */
  photoFull: string;
  identity: string;
  personality: string;
  conflict: string;
  plot: string;
  keywords: string[];
};

export const CHARACTERS: CharacterBio[] = [
  {
    slug: "liang-shanbo",
    name: "梁山伯",
    photo: "/images/characters/thumbs/liang-shanbo.jpg",
    photoFull: "/images/characters/full/liang-shanbo.jpg",
    identity:
      "流浪诗人、蝶人。无家世、周游人世，在不融入族群的同时，因对自由与爱保持执念而不断靠近「真相与选择」。",
    personality:
      "随性洒脱、浪漫纯粹；表面玩世不恭像浪子，内核却重情重义。遇到确定的人与事时会变得勇敢热烈、愿意守护到底。",
    conflict:
      "核心矛盾是「自由／不被规则拘束」与「认定后的承诺与牺牲」。当爱情不再只是诗意，而变成需要对抗命运的选择，他会从戏谑走向赴死。",
    plot:
      "闯入蝶人婚礼、与祝英台相遇并被点燃；面对老爹的操控与诬陷被困囚笼；在老醉鬼引导下选择带走祝英台并宣战命运，最终在火焰中化蝶。",
    keywords: ["自由浪子外壳", "内核重情重义", "浪漫与勇敢", "抗拒规则束缚", "愿意为爱牺牲"],
  },
  {
    slug: "zhu-yingtai",
    name: "祝英台",
    photo: "/images/characters/thumbs/zhu-yingtai.jpg",
    photoFull: "/images/characters/full/zhu-yingtai.jpg",
    identity:
      "蝶人首领「老爹」的女儿，被部落选定为婚礼「新娘／祭品」的关键人物；在被安排与被看见之间寻找自我。",
    personality:
      "外在克制、忧郁敏感；内核善良纯粹，也有倔强与反抗欲。面对命运时会先压抑情绪，但当爱情真正点燃，会迅速变得勇敢、直接。",
    conflict:
      "既想守住「被定义的正确」，也渴望自由的、真实的爱；冲突集中在「服从族群秩序」与「追随个人情感」之间。",
    plot:
      "婚礼安排迫使她直面族群的安排与祭礼本质；当梁山伯出现，她被唤醒、反问并开始行动；最终在爱与自由的选择上走向极端与牺牲。",
    keywords: ["善良纯粹", "内敛压抑到爆发", "抗争与自我觉醒", "为爱决绝"],
  },
  {
    slug: "laodie",
    name: "老爹",
    photo: "/images/characters/thumbs/laodie.jpg",
    photoFull: "/images/characters/full/laodie.jpg",
    identity:
      "蝶人的首领兼祝英台与浪花的父亲；策划与人类的婚礼以解除蝶人的诅咒，并在「变量梁山伯」出现后选择用操控与牺牲维持秩序。",
    personality:
      "外在表现为冷静理性、强势领袖；内在摇摆在「不得不」与「想维持体面」之间。既可能是真正悲情的责任承担者，也可能在自我辩护中显露出虚伪与无情。",
    conflict:
      "解除诅咒／保全蝶人的利益，与对亲密关系与爱情的退让或缺失。缺乏爱人的能力时，他更倾向用「理由」包装选择，用他人代价证明自己的正确。",
    plot:
      "化身为人类参与婚礼；利用浪花的爱欲与欲望之酒杀掉梁山伯；审判时小女孩揭露真相，老爹的威严崩塌，仍决定处决梁山伯并强调「做人意义」。",
    keywords: ["秩序与控制", "责任／利益驱动", "操控他人代价", "卖惨自辩", "缺乏爱人的能力"],
  },
  {
    slug: "lao-zuigui",
    name: "老醉鬼",
    photo: "/images/characters/thumbs/lao-zuigui.jpg",
    photoFull: "/images/characters/full/lao-zuigui.jpg",
    identity:
      "表面是守候「世界尽头」路口的醉疯乞丐；真实身份是老爹昔日的爱人／当年的新娘，并在之后以伪装活下来的幸存者。她掌握全部真相，是终局引爆真相的人。",
    personality:
      "极度清醒、强烈拒绝遗忘；表层疯癫与酒醉是掩护，内核是冷静的判断与道德底线。她孤独坚守，却同时拥有深沉的母爱与保护欲。",
    conflict:
      "「复仇」与「母爱」的双重驱动：既要夺回女儿、让背叛者付代价，也要避免孩子再次重蹈悲剧。她把真相当作最后的救赎手段。",
    plot:
      "路口警告梁山伯、毒酒前戳穿并护幼；以各种方式为祝英台争取逃离机会；终场显真身，彻底揭开「祛除诅咒婚礼」的血契真相。",
    keywords: ["清醒与伪装", "复仇与母爱", "拒绝遗忘", "真相引爆者"],
  },
  {
    slug: "langhua",
    name: "浪花儿",
    photo: "/images/characters/thumbs/langhua.jpg",
    photoFull: "/images/characters/full/langhua.jpg",
    identity:
      "蝶人女子，首领「老爹」的养女，也是祝英台的好友／镜像反差人物。她一开始被当作被操控与被利用的「工具」，最终却用生命完成选择。",
    personality:
      "外放、泼辣明艳，敢爱敢恨；用放浪与调情掩饰自卑与空虚，同时又强烈渴望被爱、被看见。她可以毫不在乎表面随意，但内里很认真。",
    conflict:
      "从「想被梁山伯的爱与关注填满内心」到「在爱欲与欺骗里迷失」，再到最后「以牺牲换取真正的成全」。她的成长线是从执念走向觉醒与升华。",
    plot:
      "爱上梁山伯却被欲望之酒与毒计蒙蔽；成为悲剧的代价，化蝶后向小女孩揭露老爹阴谋；最终为了梁山伯与祝英台的幸福牺牲自己。",
    keywords: ["外放炽热", "敢爱敢恨", "自卑渴望被看见", "执念到迷失", "最终成全牺牲"],
  },
  {
    slug: "xiao-nvhai",
    name: "小女孩",
    photo: "/images/characters/thumbs/xiao-nvhai.jpg",
    photoFull: "/images/characters/full/xiao-nvhai.jpg",
    identity:
      "蝶人与人类的混血「失去母亲的流浪儿」，被当成不祥之物；唯一依靠是老爹，却也被「保护」的名义关在洞穴里。她象征纯真与真相的入口。",
    personality:
      "怯生生外表下是生存智慧：用安静换安全、用听话换心疼。她敏感、善于试探，一旦意识到谎言与束缚，就会从隐忍走向反抗与拆穿。",
    conflict:
      "矛盾底层是「被爱却被囚禁」。她渴望理解、渴望拥有选择权；转折后把这种渴望转化为主动的牺牲：不是被迫消失，而是为自己做决定。",
    plot:
      "梁山伯出现后，她获得「另一种活法」的可能；老爹的谎言被揭穿；最终在关键时刻以自己的生命完成选择，保护祝英台与梁山伯，并让真相被说出。",
    keywords: ["透明受困", "生存智慧", "渴望被理解", "觉醒反抗", "主动选择牺牲"],
  },
];

export function getCharacter(slug: string) {
  return CHARACTERS.find((c) => c.slug === slug) ?? null;
}
