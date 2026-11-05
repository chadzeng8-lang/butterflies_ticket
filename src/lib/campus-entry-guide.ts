export type CampusEntryStep = {
  image: string;
  title: string;
  body: string;
  tips?: string[];
};

export const CAMPUS_ENTRY_HIGHLIGHTS = [
  { label: "被访人姓名", value: "辛悦" },
  { label: "被访人手机号", value: "15906350150" },
  { label: "到访部门", value: "OSA → 学生事务处" },
  { label: "来访事由", value: "音乐剧《蝶》观众入校申请" },
] as const;

export const CAMPUS_ENTRY_STEPS: CampusEntryStep[] = [
  {
    image: "/guides/campus-entry/0.jpg",
    title: "打开微信小程序",
    body: "在微信搜索「港中深入校参观预约」，点击进入小程序「参观港中深」。",
  },
  {
    image: "/guides/campus-entry/1.jpg",
    title: "阅读并同意管理规定",
    body: "仔细阅读入校管理规定，勾选同意后，点击开始预约。",
  },
  {
    image: "/guides/campus-entry/2.jpg",
    title: "选择预约类型",
    body: "在预约入口中选择第一项「访客入校报备」。",
  },
  {
    image: "/guides/campus-entry/3.jpg",
    title: "填写被访人信息",
    body: "按下方指定信息填写被访人，请勿随意更改，以免审核失败。",
    tips: ["被访人姓名：辛悦", "被访人手机号：15906350150"],
  },
  {
    image: "/guides/campus-entry/4.jpg",
    title: "选择到访部门",
    body: "在「到访部门」中输入 OSA，搜索并选择「学生事务处」。",
  },
  {
    image: "/guides/campus-entry/5.jpg",
    title: "填写个人资料",
    body: "按页面提示如实填写你的访客姓名、手机号等个人资料。",
  },
  {
    image: "/guides/campus-entry/6.jpg",
    title: "填写来访时间与事由",
    body: "选择你计划入校观演的时间，事由请填写「音乐剧《蝶》观众入校申请」。",
  },
  {
    image: "/guides/campus-entry/7.jpg",
    title: "添加随行并提交",
    body: "如有随行人员，可在此一并填写。确认信息无误后，点击「立即预约」。",
  },
  {
    image: "/guides/campus-entry/8.png",
    title: "提交成功",
    body: "出现「预约成功」即表示已提交。审批结果将通过短信通知；也可在小程序「我的」页，或访问查询页查看进度。",
    tips: ["查询页：https://visitcampus.cuhk.edu.cn/h5/admission-tours-q"],
  },
  {
    image: "/guides/campus-entry/9.jpg",
    title: "查看审核进度",
    body: "打开小程序右下角「我的」，即可查看预约记录与审批状态。若演出当天仍未审核通过，请及时联系我们。",
  },
];
