import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { faker } from '@faker-js/faker'
import { ApiError } from '@/lib/errors'
import { makeList } from '@/test/factories'
import { useCreateList } from '../hooks/useCreateList'
import NewListForm from './NewListForm'

vi.mock('../hooks/useCreateList', () => ({ useCreateList: vi.fn() }))

function EditorStub() {
  return <div data-testid="editor">{useParams().id}</div>
}

function renderForm(mutation = {}) {
  const mutate = vi.fn()
  useCreateList.mockReturnValue({
    mutate,
    isPending: false,
    error: null,
    ...mutation,
  })
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<NewListForm />} />
        <Route path="/lists/:id" element={<EditorStub />} />
      </Routes>
    </MemoryRouter>,
  )
  return mutate
}

const titleInput = () => document.querySelector('input[name="title"]')

describe('NewListForm', () => {
  it('creates the list with the trimmed title and opens its editor', async () => {
    const user = userEvent.setup()
    const list = makeList()
    const mutate = renderForm()
    mutate.mockImplementation((_title, { onSuccess }) => onSuccess(list))

    await user.type(titleInput(), `  ${list.title}  `)
    await user.click(screen.getByTestId('create-list'))

    expect(mutate.mock.calls[0][0]).toBe(list.title)
    expect(await screen.findByTestId('editor')).toHaveTextContent(list.id)
  })

  it('does not submit an empty or blank title', async () => {
    const user = userEvent.setup()
    const mutate = renderForm()

    expect(screen.getByTestId('create-list')).toBeDisabled()
    await user.type(titleInput(), '   ')

    expect(screen.getByTestId('create-list')).toBeDisabled()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('caps the title at 100 characters', () => {
    renderForm()

    expect(titleInput()).toHaveAttribute('maxLength', '100')
  })

  it.each(['list_limit', 'unknown'])(
    'shows an alert for a %s error',
    (code) => {
      renderForm({ error: new ApiError(code) })

      expect(screen.getByRole('alert')).toBeInTheDocument()
    },
  )

  it('disables submit while creating', async () => {
    const user = userEvent.setup()
    renderForm({ isPending: true })

    await user.type(titleInput(), faker.lorem.word())

    expect(screen.getByTestId('create-list')).toBeDisabled()
  })
})
