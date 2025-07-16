
import React, { useState, useEffect, useCallback } from 'react';
import { PromptParts } from './types';
import { generatePromptParts } from './services/geminiService';
import Icon from './components/Icon';

// Helper components defined outside the main App component to prevent re-creation on re-renders.

interface InputGroupProps {
  id: keyof PromptParts;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tooltip: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ id, label, placeholder, value, onChange, tooltip }) => (
  <div className="mb-6">
    <label htmlFor={id} className="flex items-center text-lg font-medium text-gray-200 mb-2">
      {label}
      <div className="relative group ml-2">
        <Icon icon="info" className="w-5 h-5 text-gray-500 cursor-pointer" />
        <div className="absolute bottom-full mb-2 w-64 bg-gray-700 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          {tooltip}
        </div>
      </div>
    </label>
    <input
      type="text"
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200"
    />
  </div>
);

const App: React.FC = () => {
  const [promptParts, setPromptParts] = useState<PromptParts>({
    target: '',
    change: '',
    preserve: '',
    style: '',
  });
  const [finalPrompt, setFinalPrompt] = useState<string>('');
  const [aiInput, setAiInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const { target, change, preserve, style } = promptParts;
    if (!target.trim() && !change.trim()) {
      setFinalPrompt('');
      return;
    }
    
    let constructedPrompt = `Transform the ${target.trim()}`;
    if(change.trim()) {
        constructedPrompt += ` to ${change.trim()}`;
    }

    if (preserve.trim()) {
      constructedPrompt += `, while maintaining the ${preserve.trim()}`;
    }

    if (style.trim()) {
      constructedPrompt += `. Style: ${style.trim()}.`;
    } else {
      constructedPrompt += '.';
    }

    setFinalPrompt(constructedPrompt);
  }, [promptParts]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPromptParts(prev => ({ ...prev, [name]: value }));
  };

  const handleAiAssistance = useCallback(async () => {
    if (!aiInput.trim()) {
      setError("请输入描述，以便AI助手进行分析。");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const parts = await generatePromptParts(aiInput);
      setPromptParts(parts);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误。');
    } finally {
      setIsLoading(false);
    }
  }, [aiInput]);

  const handleCopy = useCallback(() => {
    if (finalPrompt) {
      navigator.clipboard.writeText(finalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [finalPrompt]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500">
            Kontext 提示词工程师
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            手动或在AI辅助下，为FLUX.1 Kontext精心制作完美的提示词。
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Prompt Builder */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 text-teal-300">提示词构建器</h2>
            <form>
              <InputGroup
                id="target"
                label="目标元素"
                value={promptParts.target}
                onChange={handleInputChange}
                placeholder="例如：红色的跑车"
                tooltip="CLEAR原则：明确与限定。您想改变哪个具体元素？"
              />
              <InputGroup
                id="change"
                label="期望的变更"
                value={promptParts.change}
                onChange={handleInputChange}
                placeholder="例如：亮黑色车身和金色轮毂"
                tooltip="CLEAR原则：解释。详细描述新元素的外观。"
              />
              <InputGroup
                id="preserve"
                label="保留的元素"
                value={promptParts.preserve}
                onChange={handleInputChange}
                placeholder="例如：驾驶员，背景城市风光，反光"
                tooltip="CLEAR原则：锚定。图像的哪些部分绝不能改变？这对精度至关重要。"
              />
              <InputGroup
                id="style"
                label="质量与风格"
                value={promptParts.style}
                onChange={handleInputChange}
                placeholder="例如：照片级真实感，4K，电影级灯光"
                tooltip="CLEAR原则：优化。明确最终图像的艺术风格和质量要求。"
              />
            </form>
          </div>

          {/* Right Column: AI Assistant & Final Prompt */}
          <div className="flex flex-col gap-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h2 className="text-2xl font-semibold mb-2 text-teal-300">AI 助手</h2>
                <p className="text-gray-400 mb-4">用简单的语言描述您的目标，让 Gemini 为您构建提示词。</p>
                <textarea
                    name="ai-input"
                    rows={4}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="例如：“把女士的连衣裙变成蓝色，但其他所有东西都保持不变。”"
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 mb-4"
                />
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <button
                    onClick={handleAiAssistance}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            分析中...
                        </>
                    ) : (
                        <>
                            <Icon icon="sparkles" className="w-5 h-5 mr-2" />
                            AI 生成
                        </>
                    )}
                </button>
            </div>
            
            <div className="bg-gray-900/70 p-6 rounded-xl border-2 border-dashed border-gray-700 flex-grow flex flex-col">
              <h2 className="text-2xl font-semibold mb-4 text-teal-300">最终提示词</h2>
              <div className="flex-grow bg-gray-800 p-4 rounded-lg min-h-[150px] text-gray-300 font-mono text-base whitespace-pre-wrap">
                {finalPrompt || <span className="text-gray-500">您生成的提示词将显示在这里...</span>}
              </div>
              <button
                onClick={handleCopy}
                disabled={!finalPrompt || copied}
                className="mt-4 w-full flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
              >
                <Icon icon={copied ? 'clipboard-check' : 'copy'} className="w-5 h-5 mr-2" />
                {copied ? '已复制到剪贴板！' : '复制提示词'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
