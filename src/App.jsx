import { useEffect, useRef, useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import './App.css';

const client = generateClient({ authMode: 'userPool' });

function formatTime(iso) {
  return iso ? new Date(iso).toLocaleString() : '';
}

function TodoItem({ todo }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.content);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  async function save() {
    const value = text.trim();
    if (value && value !== todo.content) {
      await client.models.Todo.update({ id: todo.id, content: value });
    }
    setEditing(false);
  }

  function cancel() {
    setText(todo.content);
    setEditing(false);
  }

  async function attachFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      if (todo.fileKey) await remove({ path: todo.fileKey });
      const result = await uploadData({
        path: ({ identityId }) =>
          `todo-files/${identityId}/${todo.id}-${file.name}`,
        data: file,
      }).result;
      await client.models.Todo.update({
        id: todo.id,
        fileKey: result.path,
        fileName: file.name,
      });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  }

  async function openFile() {
    const { url } = await getUrl({ path: todo.fileKey });
    window.open(url.toString(), '_blank');
  }

  async function removeFile() {
    await remove({ path: todo.fileKey });
    await client.models.Todo.update({ id: todo.id, fileKey: null, fileName: null });
  }

  async function deleteTodo() {
    if (todo.fileKey) await remove({ path: todo.fileKey });
    await client.models.Todo.delete({ id: todo.id });
  }

  const edited = todo.updatedAt !== todo.createdAt;

  return (
    <li className={`todo ${todo.isDone ? 'done' : ''}`}>
      <input
        type="checkbox"
        checked={!!todo.isDone}
        onChange={() =>
          client.models.Todo.update({ id: todo.id, isDone: !todo.isDone })
        }
      />

      <div className="todo-body">
        {editing ? (
          <input
            className="edit-input"
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') cancel();
            }}
          />
        ) : (
          <span className="todo-text">{todo.content}</span>
        )}

        {todo.fileKey && (
          <span className="file-chip">
            <button className="file-link" onClick={openFile}>
              📎 {todo.fileName}
            </button>
            <button className="file-remove" onClick={removeFile} title="Remove file">
              ✕
            </button>
          </span>
        )}

        <small className="todo-time">
          {edited ? 'Edited ' : 'Added '}
          {formatTime(todo.updatedAt)}
        </small>
      </div>

      <div className="todo-actions">
        <input
          type="file"
          ref={fileInput}
          onChange={attachFile}
          style={{ display: 'none' }}
        />
        <button
          className="btn small ghost"
          onClick={() => fileInput.current.click()}
          disabled={uploading}
          title="Attach file"
        >
          {uploading ? '...' : '📎'}
        </button>

        {editing ? (
          <>
            <button className="btn small" onClick={save}>Save</button>
            <button className="btn small ghost" onClick={cancel}>Cancel</button>
          </>
        ) : (
          <button
            className="btn small ghost"
            onClick={() => {
              setText(todo.content);
              setEditing(true);
            }}
          >
            Edit
          </button>
        )}
        <button className="btn small danger" onClick={deleteTodo}>
          Delete
        </button>
      </div>
    </li>
  );
}

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newText, setNewText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: ({ items }) => {
        const sorted = [...items].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );
        setTodos(sorted);
      },
      error: (err) => setError(String(err?.message || err)),
    });
    return () => sub.unsubscribe();
  }, []);

  async function addTodo(e) {
    e.preventDefault();
    const content = newText.trim();
    if (!content) return;
    setNewText('');
    const { errors } = await client.models.Todo.create({ content, isDone: false });
    if (errors) setError(errors[0].message);
  }

  const remaining = todos.filter((t) => !t.isDone).length;

  return (
    <>
      <form className="add-form" onSubmit={addTodo}>
        <input
          placeholder="What do you need to do?"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button className="btn" type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      {todos.length === 0 ? (
        <p className="empty">No todos yet. Add your first one above 👆</p>
      ) : (
        <>
          <p className="counter">
            {remaining} remaining · {todos.length} total
          </p>
          <ul className="todo-list">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function LambdaGreeting({ name }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function callLambda() {
    setLoading(true);
    const { data, errors } = await client.queries.sayHello({ name });
    setMessage(errors ? errors[0].message : data);
    setLoading(false);
  }

  return (
    <div className="lambda-box">
      <button className="btn small" onClick={callLambda} disabled={loading}>
        {loading ? 'Calling Lambda...' : '⚡ Ask Lambda'}
      </button>
      {message && <p className="lambda-msg">{message}</p>}
    </div>
  );
}

export default function App() {
  return (
    <div className="page">
      <Authenticator>
        {({ signOut, user }) => (
          <main className="card">
            <header className="card-header">
              <div>
                <h1>My Todos</h1>
                <p className="user">{user?.signInDetails?.loginId}</p>
              </div>
              <button className="btn ghost" onClick={signOut}>Sign out</button>
            </header>
            <LambdaGreeting name={user?.signInDetails?.loginId} />
            <TodoList />
          </main>
        )}
      </Authenticator>
    </div>
  );
}