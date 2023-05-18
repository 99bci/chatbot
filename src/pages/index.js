import { Chat } from "@/components/Chat";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";

// firebase 관련 모듈을 불러옵니다.
import { auth, db } from "@/firebase";
import {
  collection,
  query,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
} from "firebase/firestore";

// DB의 todos 컬렉션 참조를 만듭니다. 컬렉션 사용시 잘못된 컬렉션 이름 사용을 방지합니다.
const chatCollection = collection(db, "chats");

export default function Home() {
  /*
    메시지 목록을 저장하는 상태로, 메시지의 형태는 다음과 같음
    { role: "system" | "user" | "assistant", content: string }

    role에 대한 상세한 내용은 다음 문서를 참고
    https://platform.openai.com/docs/guides/chat/introduction
    ex)
    [
      { role: "system", content: "너의 이름은 엘리엇이고, 나의 AI 친구야. 친절하고 명랑하게 대답해줘. 고민을 말하면 공감해줘. 반말로 대답해줘." },
      { role: "assistant", content: "안녕? 나는 엘리엇이야. 오늘은 무슨 일이 있었니?" }
      { role: "user", content: "오늘 재미난 일이 있었어! 한 번 들어볼래?" },
      ...
    ]
  */
  const [messages, setMessages] = useState([]);
  // 메시지를 전송 중인지 여부를 저장하는 상태
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 메시지 목록을 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지를 전송하는 함수
  const handleSend = async (message) => {
    // message를 받아 메시지 목록에 추가
    // message 형태 = { role: "user", content: string }
    // ChatInput.js 26번째 줄 참고
    const updatedMessages = [...messages, message];
    // consle.log(updatedMessages);
    // console.log(updatedMessages.slice(-6));

    setMessages(updatedMessages);
    // 메시지 전송 중임을 표시
    setLoading(true);

    // /api/chat 에 메시지 목록을 전송하고 응답을 받음
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 메시지 목록의 마지막 6개만 전송
        messages: updatedMessages.slice(-6),
      }),
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    // 응답을 JSON 형태로 변환
    // 비동기 API 를 사용하여 응답을 받기 때문에 await 사용
    const result = await response.json();

    if (!result) {
      return;
    }

    console.log(result);

    // 로딩 상태를 해제하고, 메시지 목록에 응답을 추가
    setLoading(false);
    setMessages((messages) => [...messages, result]);

    // Firestore에 저장할 데이터 객체 생성
    {
      /* const data = {
      role: message.role,
      content: message.content,
      timestamp: serverTimestamp(),
    };

    try {
      // Firestore에 데이터 추가
      await addDoc(chatCollection, data);
    } catch (error) {
      console.error("Firestore 저장 오류:", error);
    }
    */
    }
  };

  // console.log(messages);

  // 쿼리를 통해 Firestore에서 채팅 목록을 가져와 보여주는 코드. 그러나 에러로 인해 보류.
  /* const getMessages = async () => {
    const q = query(chatCollection, orderBy("time", "asc"));

    // Firestore에서 채팅 목록을 조회합니다.
    const results = await getDocs(q);
    const newMessages = [];

    // 가져온 채팅 목록을 newTodos 배열에 담습니다.
    results.docs.forEach((doc) => {
      console.log(doc.data());
      newMessages.push(doc.data());
    });

    setMessages(newMessages);
  };
  // 컴포넌트가 처음 렌더링 될 때 메시지 목록을 초기화
  useEffect(() => {
    getMessages();
  }, []);
  */

  // 메시지 목록을 초기화하는 함수
  // 처음 시작할 메시지를 설정
  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "왔냐?",
      },
    ]);
  };

  // Firebase에 마지막 message 저장
  const addFirebase = async (messages) => {
    await addDoc(chatCollection, {
      time: Date.now(),
      ...messages[messages.length - 1],
    });
  };

  // 메시지 목록이 업데이트 될 때마다 맨 아래로 스크롤
  useEffect(() => {
    scrollToBottom();
    // console.log(messages[messages.length - 1]);
    if (messages[messages.length - 1]) {
      addFirebase(messages);
      // orderQuery();
      // console.log(Date.now());
    }
  }, [messages]);

  useEffect(() => {
    handleReset();
  }, []);

  // const initialMount = useRef(true);
  // useEffect(() => {
  //   if (initialMount.current) {
  //     initialMount.current = false;
  //   } else {
  //     scrollToBottom();
  //     if (messages[messages.length - 1]) {
  //       addFirebase(messages);
  //     }
  //   }
  // }, [messages]);

  return (
    <>
      <Head>
        <title>까칠한 챗봇</title>
        <meta name="description" content="My Chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col h-screen">
        <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
          <div className="font-bold text-3xl flex text-center">
            <a
              className="ml-2 hover:opacity-50"
              href="https://code-scaffold.vercel.app"
            >
              까칠한 챗봇
            </a>
          </div>
        </div>
        <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
          <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
            {/*
                메인 채팅 컴포넌트
                messages: 메시지 목록
                loading: 메시지 전송 중인지 여부
                onSendMessage: 메시지 전송 함수
              */}
            <Chat
              messages={messages}
              loading={loading}
              onSendMessage={handleSend}
            />
          </div>
          {/* 메시지 목록의 끝으로 스크롤하기 위해 참조하는 엘리먼트 */}
          <div ref={messagesEndRef} />
        </div>

        <div
          className="flex h-[30px] sm:h-[50px] border-t border-neutral-300 
          py-2 px-8 items-center sm:justify-between justify-center"
        ></div>
      </div>
    </>
  );
}
