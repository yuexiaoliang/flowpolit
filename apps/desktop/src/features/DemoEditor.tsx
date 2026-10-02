import { useEffect, useRef, useState } from 'react';
import {
  CaretDown,
  DotsThree,
  Link,
  List,
  TextB,
  TextItalic,
  TextUnderline,
} from '@phosphor-icons/react';

export function Editor({
  stage,
  stopped,
  paused,
  onPublish,
  title,
  setTitle,
  siteName,
}: {
  stage: number;
  stopped: boolean;
  paused: boolean;
  onPublish: () => void;
  title: string;
  setTitle: (title: string) => void;
  siteName: string;
}) {
  const [summary, setSummary] = useState('');
  const [preview, setPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(
    '过去一年，AI 已经从一个新鲜的概念，快速走进了我们的工作与生活。无论是写作、编程，还是数据分析、创意设计，AI 工具都在帮助越来越多的人省下时间。\n\n我认为，与其把注意力放在“被取代的风险”上，不如思考如何借助 AI 放大自己的能力。AI 的真正价值，不是替代人，而是让普通人拥有以前只有专业人才才具备的能力。关键在于，我们是否愿意持续学习、积极尝试，并在实践中找到适合自己的方法。\n\n一、理解 AI 的能力边界\n\nAI 很强大，但并不是万能的。它擅长处理信息、生成内容、提高效率，但在复杂判断、情感理解和长期规划等方面，仍然需要人的参与。\n\n二、培养不可替代的能力\n\n在 AI 时代，以下几种能力将变得更加重要：\n1. 批判性思维：能够独立思考，辨别信息的真伪。\n2. 跨领域学习能力：快速掌握新工具、新知识。\n3. 沟通与协作能力：与 AI 和他人高效合作。\n4. 创造力：提出独特的观点和解决方案。',
  );
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto';
      bodyRef.current.style.height = Math.max(570, bodyRef.current.scrollHeight + 8) + 'px';
    }
  }, [body, preview]);
  return (
    <div className="site">
      <nav className="site-nav">
        <div>
          <span className="demo-logo">{siteName === '创作中心' ? '知间' : siteName}</span>
          <a className="sel" href="#editor" onClick={(e) => e.preventDefault()}>
            创作中心
          </a>
          <a href="#editor" onClick={(e) => e.preventDefault()}>
            文章管理
          </a>
          <a href="#editor" onClick={(e) => e.preventDefault()}>
            数据分析
          </a>
          <a href="#editor" onClick={(e) => e.preventDefault()}>
            收益管理
          </a>
        </div>
        <span className="avatar">林</span>
      </nav>
      <div className="site-page">
        <div className="sheet">
          <textarea
            className="article-title"
            aria-label="文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
          />
          <input
            className="article-summary"
            aria-label="文章摘要"
            placeholder="添加摘要（选填）"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <div className="toolbar">
            <span>
              正文 <CaretDown size={13} />
            </span>
            <i />
            <button aria-label="加粗">
              <TextB size={18} />
            </button>
            <button aria-label="斜体">
              <TextItalic size={18} />
            </button>
            <button aria-label="下划线">
              <TextUnderline size={18} />
            </button>
            <i />
            <button aria-label="列表">
              <List size={18} />
            </button>
            <button aria-label="插入链接">
              <Link size={18} />
            </button>
            <i />
            <button aria-label="更多排版">
              <DotsThree size={19} />
            </button>
          </div>
          {preview ? (
            <div className="article-preview">
              <h2>{title}</h2>
              {body.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <textarea
              ref={bodyRef}
              className="article-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label="文章正文"
              spellCheck="false"
            />
          )}
          <div className="sheet-foot">
            <span>● 已自动保存</span>
            <div>
              <button className="outline" onClick={() => setPreview(!preview)}>
                {preview ? '返回编辑' : '预览'}
              </button>
              <button
                className="publish"
                disabled={stopped || paused || stage === 4}
                onClick={onPublish}
              >
                {stage === 4 ? '已发布' : stopped ? '已终止' : paused ? '已暂停' : '发布文章'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
