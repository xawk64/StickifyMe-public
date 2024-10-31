import React from "react";
import Image from "next/image";
import image1 from "../../../assets/1.png";
import image2 from "../../../assets/2.png";
import image3 from "../../../assets/3.png";
import image4 from "../../../assets/4.png";
import image5 from "../../../assets/5.png";
import image6 from "../../../assets/6.png";
import image7 from "../../../assets/7.png";
import image8 from "../../../assets/8.png";
import image9 from "../../../assets/9.png";
import image10 from "../../../assets/10.png";
import ourAdvantagesBackground from "../../../assets/our_advantages_background.png";
import ourAdvantagesRightImage from "../../../assets/our_advantages_right.png";
import styles from "./styles.module.scss";

const images: { [key: number]: any } = {
  1: image1,
  2: image2,
  3: image3,
  4: image4,
  5: image5,
  6: image6,
  7: image7,
  8: image8,
  9: image9,
  10: image10,
};

interface Advantage {
  id: number;
  title: string;
  description: string;
}

const advantages: Advantage[] = [
  {
    id: 1,
    title: "ПРОСТОЙ И ЛАКОНИЧНЫЙ ИНТЕРФЕЙС СЕРВИСА",
    description:
      "Отсутствие каких-либо лишних деталей, отвлекающих внимание. Все просто и по делу",
  },
  {
    id: 2,
    title: "ИМПОРТ ЗАКАЗОВ (ИЗ WB ИЛИ EXCEL)",
    description: "Возможность печати этикеток товара и заказа ВБ в одном месте",
  },
  {
    id: 3,
    title: "УДОБСТВО СОРТИРОВКИ ЗАКАЗОВ В ЛК",
    description:
      "Возможность сортировать заказы по артикулу и названию товара для быстрого их нахождения на складе",
  },
  {
    id: 4,
    title: "ГЕНЕРАЦИЯ ШТРИХ-КОДА С ОСНОВНОЙ ИНФОРМАЦИЕЙ О ТОВАРЕ",
    description:
      "Возможность выбрать удобный формат печати: А4 или термопринтер (58*40). Разместить при необходимости маркировку ЕАС",
  },
  {
    id: 5,
    title: "ПОСЛЕДОВАТЕЛЬНОСТЬ ПЕЧАТИ НАКЛЕЕК",
    description:
      "Наклейка WB печатается следом за наклейкой товара для удобства их размещения на упаковке",
  },
  {
    id: 6,
    title: "ИСТОРИЯ ИМПОРТОВ",
    description:
      "Вся импортированная информация хранится в Личном Кабинете с возможностью повторной ее печати",
  },
  {
    id: 7,
    title:
      "ВОЗМОЖНОСТЬ ОТСЛЕЖИВАНИЯ СКЛАДОВ WB ПО КАРТЕ С ПОДРОБНОЙ ИНФОРМАЦИЕЙ О НЕМ",
    description: "График работы, адрес, бесплатная/платная приемка товаров",
  },
  {
    id: 8,
    title: "УВЕДОМЛЕНИЯ НА TELEGRAM О ВЫБРАННЫХ СКЛАДАХ",
    description:
      "Получайте своевременное уведомление о бесплатной приемке товара на складах. Настройка в Личном Кабинете займет всего пару минут",
  },
  {
    id: 9,
    title: "ОПЕРАТИВНАЯ ПОДДЕРЖКА В TELEGRAM",
    description:
      'По будням 10:00-18:00 мск готовы отвечать на Ваши вопросы по работе сервиса в режиме "онлайн"',
  },
  {
    id: 10,
    title: "ДОБАВЛЕНИЕ ФУНКЦИОНАЛА ПО ВАШИМ ПОЖЕЛАНИЯМ",
    description:
      "Мы работаем над собой и будем рады Вашим предложениям по улучшению нашего сервиса",
  },
];

export default function OurAdvantages() {
  return (
    <section className="bg-gray-100 relative">
      <Image
        src={ourAdvantagesBackground}
        alt="ourAdvantagesBackground"
        width={1709}
        height={1080}
        loading="eager"
        className="absolute top-0 left-0 w-full h-full "
        unoptimized={true}
        priority={true}
      />
      <div className="w-full h-full">
        <div className="mx-auto p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">
            НАШИ ПРЕИМУЩЕСТВА
          </h2>
          <div className={styles.container}>
            <div className="space-y-6">
              {advantages.slice(0, 5).map((advantage) => (
                <div key={advantage.id} className="flex flex-col items-start">
                  <div className="flex items-center">
                    <Image
                      src={images[advantage.id]}
                      alt={advantage.title}
                      width={40}
                      height={40}
                      loading="eager"
                      className="mr-4 min-w-[40px]"
                    />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {advantage.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600">{advantage.description}</p>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {advantages.slice(5).map((advantage) => (
                <div key={advantage.id} className="flex flex-col items-start">
                  <div className="flex items-center">
                    <Image
                      src={images[advantage.id]}
                      alt={advantage.title}
                      width={40}
                      height={40}
                      loading="eager"
                      className="mr-4 min-w-[40px]"
                    />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {advantage.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600">{advantage.description}</p>
                </div>
              ))}
            </div>
            <div className={styles.rightImage}>
              <Image
                src={ourAdvantagesRightImage}
                alt="ourAdvantagesRightImage"
                width={712}
                height={678}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
