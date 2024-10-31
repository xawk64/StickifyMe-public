import { Star } from "lucide-react"
import Image from "next/image"

interface Review {
  id: number
  organizationName: string
  organizationActivity: string
  text: string
  rating: number
}

export default function Reviews({ reviews = defaultReviews }: { reviews?: Review[] }) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
          ОТЗЫВЫ О НАС
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col p-6 bg-[#f0f7f0] rounded-lg space-y-4"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative w-24 h-24 border-2 border-primary rounded-lg overflow-hidden">
                  <Image
                    src="/placeholder.svg"
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{review.organizationName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {review.organizationActivity}
                  </p>
                </div>
              </div>
              <p className="text-center flex-grow">{review.text}</p>
              <div className="flex justify-center">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`w-5 h-5 ${
                      index < review.rating
                        ? "text-primary fill-primary"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const defaultReviews: Review[] = [
  {
    id: 1,
    organizationName: "Название организации",
    organizationActivity: "Деятельность организации",
    text: "Давно пользуюсь этим офисом,мне очень нравиться компетентность, доброжелательность,качество работы, чистота в офисе, порядок! Хорошое отношение к клиенту",
    rating: 5,
  },
  {
    id: 2,
    organizationName: "Название организации",
    organizationActivity: "Деятельность организации",
    text: "Отличный сервис и профессиональное обслуживание",
    rating: 5,
  },
  {
    id: 3,
    organizationName: "Название организации",
    organizationActivity: "Деятельность организации",
    text: "Всегда довольны качеством услуг",
    rating: 5,
  },
]