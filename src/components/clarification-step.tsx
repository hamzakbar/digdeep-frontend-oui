import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type QuestionBlock = {
  field: string
  source: string
  questions: string[]
  answers: string[]
}

interface Props {
  formQuestions: QuestionBlock[]
  onAnswerChange: (
    blockIndex: number,
    questionIndex: number,
    value: string
  ) => void
}

export function ClarificationStep({ formQuestions, onAnswerChange }: Props) {
  const groupedBySource = formQuestions.reduce<
    Record<string, { blockIndex: number; block: QuestionBlock }[]>
  >((acc, block, blockIndex) => {
    const source = block.source.split('/').pop() || block.source
    if (!acc[source]) {
      acc[source] = []
    }
    acc[source].push({ blockIndex, block })
    return acc
  }, {})

  return (
    <div className='space-y-6'>
      {Object.entries(groupedBySource).map(([source, blocks]) => (
        <section key={source} className='space-y-4'>
          <p className='font-semibold text-lg border-b pb-2 break-words'>
            <p className='font-semibold text-lg pb-2 break-words'>
              Questions for: <strong className='break-all'>{source}</strong>
            </p>
          </p>
          {blocks.map(({ blockIndex, block }) =>
            block.questions.map((question, questionIndex) => (
              <div
                key={`${block.field}-${questionIndex}`}
                className='space-y-2'
              >
                <Label>{question}</Label>
                <Textarea
                  value={block.answers[questionIndex]}
                  onChange={(e) =>
                    onAnswerChange(blockIndex, questionIndex, e.target.value)
                  }
                />
              </div>
            ))
          )}
        </section>
      ))}
    </div>
  )
}