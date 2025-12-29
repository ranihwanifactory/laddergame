
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Initialize GoogleGenAI with a named parameter using process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFunMissions = async (count: number): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `어린아이들이 친구들과 사다리 타기 게임을 할 때 나올 수 있는 재미있고 귀여운 벌칙이나 미션을 ${count}개 추천해줘. 
      예: '엉덩이로 이름 쓰기', '귀여운 표정 짓기', '옆 친구 칭찬하기' 등. 
      아주 짧고 명확하게 작성해줘.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    // Fix: Access the .text property directly from the response object
    const text = response.text;
    return JSON.parse(text || '[]') || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return Array(count).fill("즐겁게 춤추기! 💃");
  }
};

export const getCuteNicknames = async (count: number): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `어린아이들을 위한 아주 귀엽고 사랑스러운 닉네임 ${count}개를 생성해줘. 
      예: '폭신폭신 토끼', '웃음보따리 곰', '무지개 사탕' 등.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    // Fix: Access the .text property directly from the response object
    const text = response.text;
    return JSON.parse(text || '[]') || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return Array(count).fill("귀염둥이 친구");
  }
};
