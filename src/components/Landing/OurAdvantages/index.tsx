import React from "react";
import Image from "next/image";

interface Advantage {
  id: number;
  title: string;
  description: string;
}

const advantages: Advantage[] = [
  {
    id: 1,
    title: "ПРОСТОЙ И ЛАКАНИЧНЫЙ ИНТЕРФЕЙС СЕРВИСА",
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
    title: "УВЕДОМЛЕНИЯ НА Telegram О ВЫБРАННЫХ СКЛАДАХ",
    description:
      "Получайте своевременное уведомление о бесплатной приемке товара на складах. Настройка в Личном Кабинете займет всего пару минут",
  },
  {
    id: 9,
    title: "ОПЕРАТИВНАЯ ПОДДЕРЖКА в Telegram",
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
    <section className="bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">
          НАШИ ПРЕИМУЩЕСТВА
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {advantages.slice(0, 5).map((advantage) => (
              <div key={advantage.id} className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white flex items-center justify-center text-xl font-bold rounded-lg mr-4">
                  {advantage.id}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-gray-600">{advantage.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {advantages.slice(5).map((advantage) => (
              <div key={advantage.id} className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white flex items-center justify-center text-xl font-bold rounded-lg mr-4">
                  {advantage.id}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-gray-600">{advantage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 text-center">
          <Image
            src="/placeholder.svg?height=300&width=400"
            alt="Hands placing a label on a white box"
            width={400}
            height={300}
            className="mx-auto rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
