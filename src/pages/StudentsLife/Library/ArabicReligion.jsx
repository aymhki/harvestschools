import '../../../styles/StudentsLife.css'
import Table from "../../../modules/Table.jsx";
import Form from "../../../modules/Form.jsx";
import {Helmet} from "react-helmet";
function ArabicReligion() {
  return (
      <div className={'students-life-library-books-page'}>
          <Helmet>
              <title>Harvest International School | Arabic Library | Religion</title>
              <meta name="description"
                    content="Learn more about the avialable books in the Religion category at the Arabic library at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <container className={"extreme-padding-container"} lang={'ar'}>
              <h1>
                  دينية
              </h1>

              <Table tableData={
                  [
                      ['الاسم', 'السلسلة'],
                      ['عجل السامري', 'قصص القرآن'],
                      ['بقرة بني اسرائيل', 'قصص القرآن'],
                      ['ابراهيم عليه السلام', 'قصص الانبياء'],
                      ['ذو القرنين', 'قصص القرآن'],
                      ['ادم و ادريس عليهما السلام', 'قصص الانبياء'],
                      ['داود عليه السلام', 'قصص الانبياء'],
                      ['فتح المنعم - شرح صحيح مسلم ( ج1 )', '-'],
                      ['فتح المنعم - شرح صحيح مسلم (ج10 )', '-'],
                      ['فتح المنعم - شرح صحيح مسلم (ج2)', '-'],
                      ['فتح المنعم -شرح صحيح مسلم (ج3)', '-'],
                      ['فتح المنعم - شرح صحيح مسلم (ج4 )', '-'],
                      ['فتح المنعم - شرح صحيح مسلم (ج5 )', '-'],
                      ['فتح المنعم - شرح صحيح مسلم ( ج6)', '-'],
                      ['فتح المنعم - شرح صحيح مسلم (ج7)', '-'],
                      ['فتح المنعم - شرح صحيح مسلم (ج8)', '-'],
                      ['فتح المنعم - شرح صحيح مسلم (ج9)', '-'],
                      ['هدهد سليمان', 'قصص القرآن'],
                      ['اهل الكهف', 'قصص القرآن'],
                      ['هود - عليه السلام', 'قصص الانبياء'],
                      ['كلمات القران وتفسير وبيان', '-'],
                      ['الفقه الواضح (ج1)', '-'],
                      ['الفقه الواضح (ج2)', '-'],
                      ['الفقه الواضح (ج3)', '-'],
                      ['الحج', 'اركان الإسلام'],
                      ['القران الكريم', '-'],
                      ['القران الكريم وترجمة معانيه الي اللغة الانجليزية', '-'],
                      ['الشهادتان', 'اركان الإسلام'],
                      ['الصلاة', 'اركان الإسلام'],
                      ['الصوم', 'اركان الإسلام'],
                      ['الوافي في شرح الاربعين النووية', '-'],
                      ['لوط عليه السلام', 'قصص الانبياء'],
                      ['الزكاة', 'اركان الإسلام'],
                      ['معجزات الانبياء', '-'],
                      ['مفتاح سورة الطور', '-'],
                      ['مفتاح سورة طه', '-'],
                      ['محمد (صلى الله عليه وسلم ) الكتاب الثالث الرسول فى المدينة', 'قصص الانبياء'],
                      ['محمد (صلى الله عليه وسلم ) الكتاب الثانى من بداية الدعوة الى الهجرة', 'قصص الانبياء'],
                      ['محمد (صلى الله عليه وسلم ) الكتاب الاول من الميلاد الى نزول الوحى', 'قصص الانبياء'],
                      ['من القصص القراني', '-'],
                      ['من التفسير العلمي للقران الكريم ( الجزء الثلاثون )', '-'],
                      ['امرأة العزيز', 'قصص القرآن'],
                      ['موسى و هارون عليهما السلام', 'قصص الانبياء'],
                      ['موسى و الخضر', 'قصص القرآن'],
                      ['مائة من عظماء امة الاسلام غيرو مجري التاريخ', '-'],
                      ['ناقة صالح', 'قصص القرآن'],
                      ['نوح - عليه السلام', 'قصص الانبياء'],
                      ['شعيب و الياس و اليسع و ذو الكفل', 'قصص الانبياء'],
                      ['اصحاب الفغيل', 'قصص القرآن'],
                      ['اصحاب الاخدود', 'قصص القرآن'],
                      ['اسحاق و يعقوب و يوسف عليهم السلام', 'قصص الانبياء'],
                      ['صالح عليه السلام', 'قصص الانبياء'],
                      ['سليمان عليه السلام', 'قصص الانبياء'],
                      ['اسماعيل عليه السلام', 'قصص الانبياء'],
                      ['تفسير القران الكريم', '-'],
                      ['ايوب عليه السلام', 'قصص الانبياء'],
                      ['يونس - عليه السلام', 'قصص الانبياء'],
                      ['زكريا و يحيى و عيسى عليهم السلام', 'قصص الانبياء']
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

                    lang={"ar"}  captchaLength={1}/>
          </container>
      </div>
  );
}

export default ArabicReligion;