// Botanical scope is explicit: stylized models are not specimen identifications.
// Sources checked 2026-10-26. Season descriptions refer to Northern Hemisphere
// temperate cultivation unless the entry explicitly describes tropical growth.
const nc = slug => ({label:'NC State Extension · 植物资料库',url:`https://plants.ces.ncsu.edu/plants/${slug}/`});
const rhs = {label:'英国皇家园艺学会 · RHS',url:'https://www.rhs.org.uk/plants/1531/argyranthemum-frutescens/details'};
function entry(latin,scope,season,light,water,fact,source){return {latin,scope,season,light,water,fact,sources:[source]};}
export const PLANT_INFO = {
 banyan:entry('Ficus microcarpa','榕树；以小叶榕这一物种为参考。','常绿乔木；热带温暖条件下可持续生长，不宜套用温带落叶树的四季节律。','室外可生长于全日照或半阴处。','需适量水分；盆栽避免长期积水。','枝条下垂的气生根，接触土壤后能逐渐加粗，形成支柱根。',{label:'新加坡国家公园局 · NParks',url:'https://www.nparks.gov.sg/florafaunaweb/flora/2/9/2912'}),
 maple:entry('Acer palmatum','青枫；以鸡爪槭的绿叶园艺类型为参考。','落叶小乔木；春季展叶，秋季叶色随品种与环境变为黄、橙或红色，冬季休眠。','适合疏荫或半阴，炎热处需避开强烈午后日晒。','喜均匀湿润、排水良好的土壤；干旱和干风容易造成叶缘焦枯。','掌状叶片是它的识别特征之一；“秋天一定鲜红”并不适用于所有品种。',nc('acer-palmatum')),
 ginkgo:entry('Ginkgo biloba','银杏。','落叶乔木；春季展叶，秋季叶片转黄后脱落。','喜全日照。','适应多种土壤，但应排水良好，避免长期湿涝。','扇形叶片常有分叉的叶脉；银杏属于裸子植物，不开樱花那样的花。',nc('ginkgo-biloba')),
 bougain:entry('Bougainvillea spp.','三角梅；以叶子花属及光叶子花资料为参考，园艺品种花期有差异。','暖地可多次开花；对霜冻敏感，寒冷地区需保护越冬。','日照充足更有利于开花。','喜排水良好的土壤；成株较耐旱，避免盆土持续湿涝。','显眼的彩色部分是苞片，即特化的叶；真正的花小而位于苞片之间。',nc('bougainvillea-glabra')),
 hydrangea:entry('Hydrangea macrophylla','绣球；以大叶绣球为参考，不代表圆锥绣球等其他种。','落叶灌木，主要在夏季开花；部分品种具有重复开花的能力。','适合半阴或斑驳光，炎热地区避免强烈午后日晒。','喜富含有机质、湿润而排水良好的土壤，不宜长期干旱。','花序有球形和蕾丝帽形等类型；并非所有品种都能通过改变土壤条件改变花色。',nc('hydrangea-macrophylla')),
 salvia:entry('Salvia farinacea','蓝花鼠尾草；以粉萼鼠尾草为参考。','暖地为多年生草本，寒冷地区常作一年生；可从春季陆续开花到霜冻前。','喜全日照。','喜湿润、排水良好的土壤，成株也有一定耐旱性。','花萼和上部花茎带有粉白色细毛；穗状花序由许多小花组成。',nc('salvia-farinacea')),
 fern:entry('Nephrolepis cordifolia','肾蕨；与波士顿蕨等其他肾蕨属植物区分。','适合温暖湿润的生长条件；它是蕨类，没有开花季。','喜荫蔽环境，室内宜明亮散射光。','喜湿润、排水良好的基质和较高空气湿度；适应后也能耐受一定干旱。','通过孢子等方式繁殖，而不是开花结种；地下还能形成小块茎。',nc('nephrolepis-cordifolia')),
 monstera:entry('Monstera deliciosa','龟背竹。','热带常绿攀缘植物，温暖条件下生长；普通室内环境较少开花结果。','宜明亮散射光，避免强烈直射日光灼伤叶片。','浇透后，让盆土上部适当干燥再浇；保持排水与空气湿度。','幼叶与成叶形态不同；植株成熟后，叶片才更常出现裂口与孔洞。',nc('monstera-deliciosa')),
 hosta:entry('Hosta plantaginea','玉簪；以白花、有香味的玉簪为参考。','多年生草本；生长季形成叶丛，夏末至初秋开白花，寒冷季节地上部休眠。','适合半阴或疏荫处。','喜富含有机质、湿润且排水良好的土壤。','白色花具有香味，常在傍晚开放；并不是所有玉簪属园艺品种都同样芳香。',nc('hosta-plantaginea')),
 grass:entry("Miscanthus sinensis ‘Gracillimus’",'细叶芒；以芒的细叶园艺品种 Gracillimus 为参考。','多年生丛生草；暖季生长，夏末至秋季抽穗，寒冷季节叶片转为枯黄色。','全日照更利于健壮生长和开花，过阴容易倒伏。','喜湿润、排水良好的土壤；成株可耐一定干旱。','细长叶片拱垂成丛；高出叶丛的羽状部分是花序，不是另一种叶子。',{label:'佛罗里达大学 · UF/IFAS Extension',url:'https://ask.ifas.ufl.edu/publication/FP406'}),
 ivy:entry('Hedera helix','常春藤；此处采用欧洲常春藤的资料，其他同名种不宜直接套用。','常绿木质攀缘植物；成熟枝条可在秋季开花，幼龄攀爬枝通常不开花。','可适应半阴与荫蔽环境。','宜湿润而排水良好的土壤，避免长期积水。','靠附着根攀爬；模型采用幼龄枝的掌状裂叶，常有 3—5 裂。成熟开花枝的叶片通常不裂。',nc('hedera-helix')),
 pothos:entry('Epipremnum aureum','绿萝。','热带常绿藤本；温暖、光照适宜时生长，室内通常以幼态观叶为主。','明亮散射光更合适；能耐较弱光线，但耐阴不等于不需要光。','用排水良好的基质；两次浇水之间让盆土适当干燥，避免根部长期过湿。','模型采用带黄绿斑纹的幼态心形叶；并非所有园艺类型都有相同斑纹。成熟植株的叶形和大小可明显改变。',nc('epipremnum-aureum')),
 sakura:entry('Prunus serrulata · 园艺类型','樱花；以山樱类观赏樱及其园艺类型为参考，不代表所有樱属植物。','落叶乔木，通常春季开花；开花早晚、重瓣程度随品种和气候变化。','日照充足更利于开花。','喜湿润、排水良好的壤土，忌长期积水。','许多观赏樱以花为主要观赏对象，不能据此推断会结出可采食的甜樱桃。',nc('prunus-serrulata')),
 magnolia:entry('Magnolia denudata','白玉兰。','落叶乔木；通常冬末至早春开花，先花后叶；晚霜可能伤害花朵。','全日照至半阴均可。','喜湿润、排水良好、略偏酸且肥沃的土壤，避免过干或积水。','白色芳香花的花被片外观相似；开花时枝头常还没有展开的新叶。',nc('magnolia-denudata')),
 tulip:entry('Tulipa spp. · 园艺品种','郁金香；品种间花期和复花能力差异很大。','球根植物，主要春季开花；花后叶片逐渐枯黄，进入休眠。','适合全日照。','生长期需适度水分和良好排水；休眠期不宜持续湿涝。','花后仍绿色的叶片会为鳞茎积累养分，应等其自然枯黄，而不是立即剪净。',nc('tulipa')),
 daisy:entry('Argyranthemum frutescens','玛格丽特；以木茼蒿及相关园艺类型为参考。','木质基部的多年生植物；RHS记录夏季开花，实际花期随当地气候和品种变化；不耐严寒。','喜全日照。','宜中等肥力、排水良好的土壤；干燥时补水，避免积水。','看似“一朵花”的头状花序，实际上由外围舌状花与中央许多小花组成。',rhs),
 allium:entry('Allium giganteum','大花葱；以巨葱为参考，其他观赏葱花期可不同。','多年生球根植物，初夏形成高大的球形花序；开花前后叶片可能开始黄化。','喜全日照。','生长期宜适度湿润、排水良好；忌长期积水。','一个紫色“花球”是一整个伞形花序，由许多小花组成。',nc('allium-giganteum')),
 muhly:entry('Muhlenbergia capillaris','粉黛乱子草。','暖季型多年生草，夏末至秋季出现粉色花序；入冬后逐渐转为褐黄色。','全日照有利于形成更饱满的花序。','喜排水良好的土壤；成株耐热、耐一定干旱。','粉色“云雾”来自细密花序，并非叶片全年都是粉色。',nc('muhlenbergia-capillaris')),
 echeveria:entry('Echeveria spp.','蓝石莲是园艺商品名；模型未对应已鉴定品种，此处仅介绍拟石莲花属的共性。','多年生多肉植物；生长与开花节律随物种、温度和栽培条件变化，不设统一花期。','需要充足光照；从弱光转到强光时宜逐步适应。','用排水很快的基质，干燥后再浇水，避免长期潮湿；多数种不耐霜冻。','莲座状结构是肉质叶片，不是花；真正的花长在抽出的花梗上。',nc('echeveria')),
 wisteria:entry('Wisteria sinensis','紫藤；以中国紫藤为参考。','落叶木质藤本，通常春季开花，花序可在叶片完全展开前出现。','全日照至半阴，日照充足通常开花更好。','喜湿润、排水良好的土壤。','通过茎缠绕支撑物攀爬；生长强健，需要牢固支架和适当修剪，幼株可能多年后才开花。',nc('wisteria-sinensis')),
};

export function showPlantInfo(species,thumbnail){
 const info=PLANT_INFO[species.id],dialog=document.getElementById('plantInfoDialog');
 document.getElementById('plantInfoTitle').textContent=species.name;
 document.getElementById('plantInfoLatin').textContent=info.latin;
 document.getElementById('plantInfoScope').textContent=info.scope;
 const image=document.getElementById('plantInfoImage');image.src=thumbnail;image.alt=`${species.name}游戏模型示意，并非植物鉴定照片`;
 const fields=document.getElementById('plantInfoFields');fields.replaceChildren();
 for(const [label,key] of [['生长与花期','season'],['光照偏好','light'],['水分与土壤','water'],['认识它','fact']]){
  const section=document.createElement('section'),title=document.createElement('h3'),text=document.createElement('p');title.textContent=label;text.textContent=info[key];section.append(title,text);fields.append(section);
 }
 const sources=document.getElementById('plantInfoSources');sources.replaceChildren();
 for(const source of info.sources){const link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=source.label+' ↗';sources.append(link);}
 dialog.showModal();
}
