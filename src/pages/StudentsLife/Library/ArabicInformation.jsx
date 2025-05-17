import '../../../styles/StudentsLife.css'
import Table from "../../../modules/Table.jsx";
import Form from "../../../modules/Form.jsx";
import {Helmet} from "react-helmet-async";

function ArabicInformation() {
  return (
      <div className={'students-life-library-books-page'}>
          <Helmet>
              <title>Harvest International School | Arabic Library | Informative</title>
              <meta name="description"
                    content="Learn more about the avialable books in the Informative category at the Arabic library at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <div className={"extreme-padding-container"} lang={'ar'}>
              <h1>
                  تعليمية
              </h1>

              <Table tableData={
                  [
                      ['الاسم', 'السلسلة'],
                      ['افشاء السلام', 'هذه اخلاقنا'],
                      ['حق الجار', 'هذه اخلاقنا'],
                      ['حسن الخلق', 'هذه اخلاقنا'],
                      ['حسن الظن', 'هذه اخلاقنا'],
                      ['كتمان السر', 'هذه اخلاقنا'],
                      ['كظم الغيظ', 'هذه اخلاقنا'],
                      ['العدل', 'هذه اخلاقنا'],
                      ['العفة', 'هذه اخلاقنا'],
                      ['الاعتذار', 'هذه اخلاقنا'],
                      ['الادب', 'هذه اخلاقنا'],
                      ['الحكمة', 'هذه اخلاقنا'],
                      ['الحلم', 'هذه اخلاقنا'],
                      ['الحياء', 'هذه اخلاقنا'],
                      ['الاخاء', 'هذه اخلاقنا'],
                      ['الاخلاص', 'هذه اخلاقنا'],
                      ['الكلم الطيب', 'هذه اخلاقنا'],
                      ['الكرم', 'هذه اخلاقنا'],
                      ['الامانة', 'هذه اخلاقنا'],
                      ['الامر بالمعروف و النهى عن المنكر', 'هذه اخلاقنا'],
                      ['الانترنت', 'سلسلة الكمبيوتر التعليمية'],
                      ['القناعة', 'هذه اخلاقنا'],
                      ['الرفق', 'هذه اخلاقنا'],
                      ['الرحمة', 'هذه اخلاقنا'],
                      ['الصبر', 'هذه اخلاقنا'],
                      ['الصدق', 'هذه اخلاقنا'],
                      ['الشبكات', 'سلسلة الكمبيوتر التعليمية'],
                      ['الشجاعة', 'هذه اخلاقنا'],
                      ['الشكر', 'هذه اخلاقنا'],
                      ['الشورى', 'هذه اخلاقنا'],
                      ['الاستئذان', 'هذه اخلاقنا'],
                      ['التأمل', 'هذه اخلاقنا'],
                      ['التعاون', 'هذه اخلاقنا'],
                      ['الثبات', 'هذه اخلاقنا'],
                      ['الطهارة', 'هذه اخلاقنا'],
                      ['التوبة', 'هذه اخلاقنا'],
                      ['التواضع', 'هذه اخلاقنا'],
                      ['التوكل على الله', 'هذه اخلاقنا'],
                      ['التيسير', 'هذه اخلاقنا'],
                      ['الوفاء', 'هذه اخلاقنا'],
                      ['الورع', 'هذه اخلاقنا'],
                      ['الوسائط المتعددة ويندوز فيستا', 'سلسلة الكمبيوتر التعليمية'],
                      ['الايثار', 'هذه اخلاقنا'],
                      ['الزهد', 'هذه اخلاقنا'],
                      ['مايكروسوفت باور بوينت 2007', 'سلسلة الكمبيوتر التعليمية'],
                      ['مايكروسوفت اكسيل 2007', 'سلسلة الكمبيوتر التعليمية'],
                      ['مايكروسوفت اكسيس 2007', 'سلسلة الكمبيوتر التعليمية'],
                      ['مايكروسوفت اوفيس 2007', 'سلسلة الكمبيوتر التعليمية'],
                      ['مايكروسوفت اوت توك 2007', 'سلسلة الكمبيوتر التعليمية'],
                      ['مايكروسوفت ويندوز 7 ( الكتاب الثاني )', 'سلسلة الكمبيوتر التعليمية'],
                      ['مايكروسوفت ويندوز 7 ( الكتاب الاول )', 'سلسلة الكمبيوتر التعليمية'],
                      ['مايكروسوفت ويندوز فيستا ( الكتاب الثاني )', 'سلسلة الكمبيوتر التعليمية'],
                      ['مايكروسوفت ويندوز فيستا ( الكتاب الاول)', 'سلسلة الكمبيوتر التعليمية'],
                      ['نظم التشغيل', 'سلسلة الكمبيوتر التعليمية'],
                      ['اساسيات الكمبيوتر', 'سلسلة الكمبيوتر التعليمية']
                  ]

              } numCols={2}
                     sortConfigParam={{column: 1, direction: 'ascending'}}/>


              <h1 lang={'ar'}>
                  اقترح كتاب للمكتبة لاضافته الى مجموعتنا
              </h1>

              <Form sendPdf={false} mailTo={'ayman.ibrahim@harvestschools.com'}
                    formTitle={'اقتراح كتاب للمكتبة لاضافته الى مجموعتنا'}
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

                    lang={"ar"}
                    captchaLength={1}/>

          </div>
      </div>
  );
}

export default ArabicInformation;