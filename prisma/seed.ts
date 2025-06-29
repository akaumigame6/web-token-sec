// 実行は npx prisma db seed　(package.jsonの prisma にコマンド追加)
// 上記コマンドで実行する範囲は相対パスを基準にする必要があるので注意
import { v4 as uuid } from "uuid";
import { PrismaClient, Role,} from "@prisma/client";
import { UserSeed, userSeedSchema } from "../src/app/_types/UserSeed";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // テスト用のユーザ情報の「種」となる userSeeds を作成
  const userSeeds: UserSeed[] = [
    {
      name: "高負荷 耐子",
      password: "password1111",
      email: "admin01@example.com",
      role: Role.ADMIN,
      secretQuestionId: 1, // 最初に飼ったペットの名前は？
      secretAnswer: "ポチ",
    },
    {
      name: "不具合 直志",
      password: "password2222",
      email: "admin02@example.com",
      role: Role.ADMIN,
      secretQuestionId: 2, // 小学校の名前は？
      secretAnswer: "〇▼小学校",
    },
    {
      name: "構文 誤次郎",
      password: "password1111",
      email: "user01@example.com",
      role: Role.USER,
      aboutSlug: "gojiro",
      aboutContent: "構文誤次郎です。<br>よろしくお願いします。",
      secretQuestionId: 3, // 子どもの頃のあだ名は？
      secretAnswer: "あやじろー",
    },
    {
      name: "仕様 曖昧子",
      password: "password2222",
      email: "user02@example.com",
      role: Role.USER,
      aboutSlug: "aimaiko",
      aboutContent: "仕様曖昧子と申します。仲良くしてください。",
      secretQuestionId: 4, // 好きな色は？
      secretAnswer: "青みがかったブルー",
    },
  ];

  // userSeedSchema を使って UserSeeds のバリデーション
  try {
    await Promise.all(
      userSeeds.map(async (userSeed, index) => {
        const result = userSeedSchema.safeParse(userSeed);
        if (result.success) return;
        console.error(
          `Validation error in record ${index}:\n${JSON.stringify(userSeed, null, 2)}`,
        );
        console.error("▲▲▲ Validation errors ▲▲▲");
        console.error(
          JSON.stringify(result.error.flatten().fieldErrors, null, 2),
        );
        throw new Error(`Validation failed at record ${index}`);
      }),
    );
  } catch (error) {
    throw error;
  }

  // 各テーブルの全レコードを削除
  await prisma.user.deleteMany();
  await prisma.secretQuestion.deleteMany();

  // ユーザ（user）テーブルにテストデータを挿入
  await prisma.user.createMany({
    data: userSeeds.map((userSeed) => ({
      id: uuid(),
      name: userSeed.name,
      password: bcrypt.hashSync(userSeed.password, 10),
      role: userSeed.role,
      email: userSeed.email,
      aboutSlug: userSeed.aboutSlug || null,
      aboutContent: userSeed.aboutContent || "",
      secretQuestionId: userSeed.secretQuestionId,
      secretAnswer: bcrypt.hashSync(userSeed.secretAnswer, 10),
    })),
  });

  // シークレット質問（secretquestion）テーブルにデータを挿入
  const secretQuestions = [
    { question: "最初に飼ったペットの名前は？" },
    { question: "小学校の名前は？" },
    { question: "子どもの頃のあだ名は？" },
    { question: "好きな色は？" },
    { question: "好きな食べ物は？" },
    { question: "好きな映画は？" },
    { question: "初めて行った海外の国は？" },
  ];
  await prisma.secretQuestion.createMany({
    data: secretQuestions,
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => console.error(e.message))
  .finally(async () => {
    await prisma.$disconnect();
  });
