import '../../../styles/StudentsLife.css'
import Table from "../../../modules/Table.jsx";
import Form from "../../../modules/Form.jsx";
import {Helmet} from "react-helmet";


function ArabicGeneral() {
    return (
        <div className={'students-life-library-books-page'}>
            <Helmet>
                <title>Harvest International School | Arabic Library | General</title>
                <meta name="description"
                      content="Learn more about the avialable books in the Genral category at the Arabic library at Harvest International School in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <container className={"extreme-padding-container"} lang={'ar'}>
                <h1>
                    عامة
                </h1>

                <Table tableData={
                    [
                        ['الاسم', 'السلسلة'],
                        ['100 دقيقة مثيرة في حياة الفراعنة', '-'],
                        ['313', '-'],
                        ['عبقرية عمر', '-'],
                        ['عبقرية خالد', '-'],
                        ['عبقرية الامام', '-'],
                        ['عبقرية الصديق', '-'],
                        ['عبقرية محمد', '-'],
                        ['اعجب الرحلات في التاريخ', '-'],
                        ['ابتسم فانت ميت', '-'],
                        ['بين القصرين', '-'],
                        ['ذات', '-'],
                        ['دمعة فابتسامة', '-'],
                        ['دموع في عيون وقحة', '-'],
                        ['ادارة الوقت', '-'],
                        ['دروع الوقاية بأحزاب الحماية', '-'],
                        ['فن اتخاذ القرار', '-'],
                        ['حكاية المؤسسة', '-'],
                        ['هاتف المغيب', '-'],
                        ['حواديتي مجموعة قصصية ساخرة', '-'],
                        ['حول العالم في 200 يوم', '-'],
                        ['حياة بلا توتر', '-'],
                        ['جدد حياتك', '-'],
                        ['جمهورية فرحات', '-'],
                        ['اخلاقيات الشباب', '-'],
                        ['اخر الدنيا', '-'],
                        ['كليلة و دمنة', '-'],
                        ['العادات السبع للناس الاكثر فاعلية', '-'],
                        ['الاعجاز العلمي في السنة النبوية', '-'],
                        ['العسكري الاسود', '-'],
                        ['العتب علي النظر', '-'],
                        ['البحار مندي وقصص عن البحر', '-'],
                        ['البلاغة الواضحة', '-'],
                        ['البيات الشتوي', 'احب ان اكتشف'],
                        ['الادب الصغير و الادب الكبير', '-'],
                        ['الاذكار المنتخب من كلام سيد الابرار', '-'],
                        ['الذين عادوا الي السماء', '-'],
                        ['الذين هبطوا من السماء', '-'],
                        ['الذين هاجروا', '-'],
                        ['الخلفاء الراشدون', '-'],
                        ['المفاتيح العشرة للنجاح', '-'],
                        ['النحو الواضح في قواعد اللغة العربية ( المجلد الثاني )', '-'],
                        ['النحو الواضح في قواعد اللغة العربية ( المجلد الاول )', '-'],
                        ['النسر يهبط', '-'],
                        ['الصعود الي الهاوية', '-'],
                        ['الشوقيات لامير الشعراء احمد شوقي', '-'],
                        ['السكرية', '-'],
                        ['التفكير الامثل', '-'],
                        ['التفكير السلبي و التفكير الايجابي', '-'],
                        ['التاريخ الاسلامي', '-'],
                        ['التاريخ الاسلامي الوجيز', '-'],
                        ['الزيني بركات', '-'],
                        ['ام العواجز', '-'],
                        ['مبدعون خالدون (ج1 )', '-'],
                        ['مبدعون خالدون (ج2)', '-'],
                        ['مبدعون خالدون (ج3)', '-'],
                        ['محتار الصحاح', '-'],
                        ['مالك', '-'],
                        ['من دفتر العشق و الغربة', '-'],
                        ['مقدمة ابن خلدون', '-'],
                        ['مسيا', '-'],
                        ['مؤامرة بروكسل', '-'],
                        ['انبياء الله', '-'],
                        ['نساء في قطار الجاسوسية', '-'],
                        ['#انستا_حياة', '-'],
                        ['قالوا ( ج1)', '-'],
                        ['قالوا (ج2)', '-'],
                        ['قنديل ام هاشم', '-'],
                        ['قصر الشوق', '-'],
                        ['رحلات ابن فؤاد في وصف البلاد و العباد', '-'],
                        ['رحلات السندباد البري', '-'],
                        ['رسالة البصائر في المصائر', '-'],
                        ['روائع الشعر الاسلامي', '-'],
                        ['صح النوم', '-'],
                        ['شمائل الرسول صل الله عليه وسلم', '-'],
                        ['استمتع بحياتك', '-'],
                        ['سيرة خاتم النبيين', '-'],
                        ['تعطير الانام في تعبير المنام', '-'],
                        ['طه الغريب', '-'],
                        ['اثار و اسرار (ج1 )', '-'],
                        ['اثار و اسرار (ج2)', '-'],
                        ['اطلس العالم', '-'],
                        ['تراب الميري', '-'],
                        ['تاريخ اداب العرب ( ج1 )', '-'],
                        ['تاريخ اداب العرب (ج2)', '-'],
                        ['تاريخ اداب العرب (ج3)', '-'],
                        ['طياح الدبدوب الشره', 'حيوانات ظريفة'],
                        ['تيستروجين', '-']
                    ]

                } numCols={2}

                       sortConfigParam={{column: 0, direction: 'ascending'}}/>


                <h1 lang={'ar'}>
                    اقترح كتاب للمكتبة لاضافته الى مجموعتها
                </h1>

                <Form sendPdf={false} mailTo={'ayman.ibrahim@harvestschools.com'}
                      formTitle={'اقتراح كتاب للمكتبة لاضافته الى مجموعتها'}
                      fields={
                          [
                              {
                                  id: 1,
                                  type: 'text',
                                  label: 'الاسم',
                                  name: 'name',
                                  required: true,
                                  labelOutside: false,
                                  httpName: 'Name',
                                  placeholder: 'ادخل اسمك',
                                  widthOfField: 2
                              },
                              {
                                  id: 2,
                                  type: 'email',
                                  label: 'البريد الالكتروني',
                                  name: 'email',
                                  required: true,
                                  labelOutside: false,
                                  httpName: 'Email',
                                  placeholder: 'ادخل بريدك الالكتروني',
                                  widthOfField: 2
                              },
                              {
                                  id: 3,
                                  type: 'text',
                                  label: 'عنوان الكتاب',
                                  name: 'book_title',
                                  required: true,
                                  labelOutside: false,
                                  httpName: 'Book Title',
                                  placeholder: 'ادخل عنوان الكتاب',
                                  widthOfField: 3
                              },
                              {
                                  id: 4,
                                  type: 'text',
                                  label: 'المؤلف او الكاتب',
                                  name: 'author',
                                  required: true,
                                  labelOutside: false,
                                  httpName: 'Author',
                                  placeholder: 'ادخل اسم المؤلف او الكاتب',
                                  widthOfField: 3
                              },
                              {
                                  id: 5,
                                  type: 'text',
                                  label: 'السلسلة او الموزع',
                                  name: 'series',
                                  required: true,
                                  labelOutside: false,
                                  httpName: 'Series',
                                  placeholder: 'ادخل اسم السلسلة او الموزع',
                                  widthOfField: 3
                              },
                              {
                                  id: 6,
                                  type: 'textarea',
                                  label: 'التفاصيل',
                                  name: 'details',
                                  required: true,
                                  labelOutside: false,
                                  httpName: 'Details',
                                  placeholder: 'ادخل تفاصيل الكتاب',
                                  widthOfField: 1
                              }
                          ]
                      }

                      lang={"ar"}  captchaLength={1}/>

            </container>
        </div>
);
}

export default ArabicGeneral;