import { FormEvent, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../components/AuthContext';
import {
  changeUserPassword,
  createUser,
  listUsers,
  updateUser
} from '../lib/web-api';
import { UserRecord } from '../types';

const roleOptions = ['admin', 'user'] as const;

export function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createRole, setCreateRole] = useState<(typeof roleOptions)[number]>('user');
  const [creating, setCreating] = useState(false);

  const [editingUsername, setEditingUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<(typeof roleOptions)[number]>('user');
  const [updating, setUpdating] = useState(false);

  const [passwordUsername, setPasswordUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const refreshUsers = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const list = await listUsers();
      setUsers(list);
      if (list.length && !passwordUsername) {
        setPasswordUsername(list[0].username);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const usersSorted = useMemo(
    () =>
      [...users].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [users]
  );

  const startEdit = (record: UserRecord) => {
    setEditingUsername(record.username);
    setEditRole(record.role === 'admin' ? 'admin' : 'user');
    setEditDisplayName(
      typeof record.metadata?.displayName === 'string' ? record.metadata.displayName : ''
    );
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createUsername.trim() || !createPassword.trim()) {
      setError('Username and password are required.');
      return;
    }

    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      await createUser({
        username: createUsername.trim(),
        password: createPassword,
        role: createRole,
        displayName: createDisplayName.trim() || undefined
      });
      setCreateUsername('');
      setCreatePassword('');
      setCreateDisplayName('');
      setCreateRole('user');
      setMessage('User created.');
      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUsername) {
      return;
    }

    setUpdating(true);
    setError(null);
    setMessage(null);

    try {
      await updateUser({
        username: editingUsername,
        role: editRole,
        displayName: editDisplayName
      });
      setMessage('User updated.');
      setEditingUsername('');
      setEditDisplayName('');
      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordUsername || !currentPassword || !newPassword) {
      setError('All password fields are required.');
      return;
    }

    setChangingPassword(true);
    setError(null);
    setMessage(null);

    try {
      await changeUserPassword({
        username: passwordUsername,
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-flow">
        <section className="panel hero-panel">
          <p className="eyebrow">Admin</p>
          <h1>Access denied</h1>
          <p>This area is available only for admin accounts.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-flow">
      <section className="panel hero-panel">
        <p className="eyebrow">Admin</p>
        <h1>User management</h1>
        <p>Manage web-app users from desktop using shared authentication APIs.</p>
      </section>

      {error ? (
        <section className="panel">
          <p className="form-error">{error}</p>
        </section>
      ) : null}
      {message ? (
        <section className="panel">
          <p className="form-success">{message}</p>
        </section>
      ) : null}

      <section className="panel">
        <header className="split-header">
          <div>
            <p className="eyebrow">Users</p>
            <h2>{loading ? 'Loading...' : `${usersSorted.length} accounts`}</h2>
          </div>
          <button className="primary-btn" type="button" onClick={refreshUsers}>
            Refresh
          </button>
        </header>

        <div className="table-wrap">
          <table className="job-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Display Name</th>
                <th>Role</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersSorted.map((record) => (
                <tr key={record.username}>
                  <td>{record.username}</td>
                  <td>
                    {typeof record.metadata?.displayName === 'string'
                      ? record.metadata.displayName
                      : '-'}
                  </td>
                  <td>{record.role ?? 'user'}</td>
                  <td>{new Date(record.createdAt).toLocaleString()}</td>
                  <td>{new Date(record.updatedAt).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => startEdit(record)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !usersSorted.length ? (
                <tr>
                  <td colSpan={6}>No users found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Create user</p>
        <form className="admin-form-grid" onSubmit={handleCreate}>
          <label className="form-label">
            <span>Username</span>
            <input
              className="input"
              value={createUsername}
              onChange={(event) => setCreateUsername(event.target.value)}
              placeholder="username"
            />
          </label>
          <label className="form-label">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={createPassword}
              onChange={(event) => setCreatePassword(event.target.value)}
              placeholder="Password"
            />
          </label>
          <label className="form-label">
            <span>Display Name</span>
            <input
              className="input"
              value={createDisplayName}
              onChange={(event) => setCreateDisplayName(event.target.value)}
              placeholder="Display name"
            />
          </label>
          <label className="form-label">
            <span>Role</span>
            <select
              className="input"
              value={createRole}
              onChange={(event) =>
                setCreateRole(event.target.value as (typeof roleOptions)[number])
              }
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-btn" type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </section>

      <section className="panel">
        <p className="eyebrow">Edit user</p>
        <form className="admin-form-grid" onSubmit={handleEdit}>
          <label className="form-label">
            <span>Username</span>
            <input
              className="input"
              value={editingUsername}
              onChange={(event) => setEditingUsername(event.target.value)}
              placeholder="Select from table or enter"
            />
          </label>
          <label className="form-label">
            <span>Display Name</span>
            <input
              className="input"
              value={editDisplayName}
              onChange={(event) => setEditDisplayName(event.target.value)}
              placeholder="Display name"
            />
          </label>
          <label className="form-label">
            <span>Role</span>
            <select
              className="input"
              value={editRole}
              onChange={(event) =>
                setEditRole(event.target.value as (typeof roleOptions)[number])
              }
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-btn" type="submit" disabled={updating || !editingUsername}>
            {updating ? 'Saving...' : 'Save'}
          </button>
        </form>
      </section>

      <section className="panel">
        <p className="eyebrow">Password reset</p>
        <form className="admin-form-grid" onSubmit={handlePasswordChange}>
          <label className="form-label">
            <span>User</span>
            <select
              className="input"
              value={passwordUsername}
              onChange={(event) => setPasswordUsername(event.target.value)}
            >
              <option value="">Select user</option>
              {usersSorted.map((record) => (
                <option key={record.username} value={record.username}>
                  {record.username}
                </option>
              ))}
            </select>
          </label>
          <label className="form-label">
            <span>Current password</span>
            <input
              className="input"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
            />
          </label>
          <label className="form-label">
            <span>New password</span>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
            />
          </label>
          <button
            className="primary-btn"
            type="submit"
            disabled={changingPassword || !passwordUsername}
          >
            {changingPassword ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
  );
}
