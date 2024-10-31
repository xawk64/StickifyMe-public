import Image from "next/image";
import Link from "next/link";
import footerBackground from "../../../assets/footer.png";
import logo from "../../../assets/logo.png";
import styles from "./styles.module.scss";
import telegramLogo from "../../../assets/telegram-logo.png";
import emailLogo from "../../../assets/email.png";

export default function Footer() {
  return (
    <footer className={styles.root}>
      <div className="max-w-[1920px] w-full h-full">
        <Image
          src={footerBackground}
          alt="footerBackground"
          width={1920}
          height={298}
          loading="eager"
          className={styles.background}
          style={{ objectFit: "cover" }}
        />

        <div className=" w-full h-full flex flex-col md:flex-row justify-between items-center gap-8 py-2 px-6 md:py-5 md:px-20">
          <div className="">
            <Image src={logo} alt="logo" width={204} height={172} />
          </div>
          <div className="flex flex-row w-full md:w-auto justify-between md:gap-20">
            <div className="flex flex-col items-center gap-4">
              <p className="font-bold">КОНТАКТЫ</p>
              <div className="flex flex-row items-center gap-4">
                <Link href="mailto:support@example.com">
                  <Image
                    src={emailLogo}
                    alt="emailLogo"
                    width={32}
                    height={32}
                  />
                  <span className="sr-only">Email</span>
                </Link>
                {/* <Link
                href="https://vk.com"
                className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.42-1.32-1.36-1.95-1.45-2.21-1.45-.37 0-.48.11-.48.66v1.29c0 .44-.14.66-1.32.66-1.93 0-4.07-1.17-5.58-3.36-2.27-3.23-2.89-5.64-2.89-6.13 0-.28.11-.53.66-.53h1.46c.44 0 .66.22.85.66.92 2.67 2.46 5 3.11 5 .24 0 .35-.11.35-.72v-2.89c-.07-1.29-.74-1.39-.74-1.85 0-.22.18-.44.48-.44h2.3c.37 0 .51.22.51.66v3.89c0 .44.11.59.18.59.24 0 .44-.15.88-.59 1.36-1.51 2.34-3.84 2.34-3.84.13-.28.35-.53.83-.53h1.46c.44 0 .66.24.53.66-.22 1.01-2.36 4.03-2.36 4.03-.18.28-.24.44 0 .7.18.2.77.83 1.17 1.33 1.07 1.36 1.85 2.5 2.08 3.29.18.66-.11.88-.55.88z" />
                </svg>
                <span className="sr-only">VK</span>
              </Link> */}
                <Link
                  href="https://telegram.me/example.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={telegramLogo}
                    alt="telegramLogo"
                    width={32}
                    height={32}
                  />
                  <span className="sr-only">Telegram</span>
                </Link>
              </div>
            </div>
            <nav className="flex flex-col  items-center gap-4 text-sm ">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Политика конфеденциальности
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Пользовательское соглашение
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
