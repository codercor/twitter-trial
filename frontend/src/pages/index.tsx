import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import axios from 'axios'
const inter = Inter({ subsets: ['latin'] })

const service = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

const login = async (username: string, password: string) => {
  let response = await service.post('/login', { username, password })
  let { token, user } = response.data;
  localStorage.setItem('jwt', token);
  return user;
}

const getUser = async () => {
  let token = localStorage.getItem('jwt');
  let response = await service.get('/me', { headers: { Authorization: `Bearer ${token}` } })
  return response.data.user
}

const register = async (username: string, password: string) => {
  let response = await service.post('/register', { username, password })
  let { token, user } = response.data;
  localStorage.setItem('jwt', token);
  return user;
}

const connectTwitter = async () => {
  let token = localStorage.getItem('jwt');
  let response = await service.get('/connect', { headers: { Authorization: `Bearer ${token}` } })
  const { authLink } = response.data;
  return authLink;
}

const disconnectTwitter = async () => {
  let token = localStorage.getItem('jwt');
  let response = await service.get('/disconnect', { headers: { Authorization: `Bearer ${token}` } })
  return response;
}


const getLikes = async () => {
  let token = localStorage.getItem('jwt');
  let response = await service.get('/likes', { headers: { Authorization: `Bearer ${token}` } })
  const likes = response?.data?.tweets?._realData?.data?.map((t: any) => t.text) || [];
  return likes;
}


export default function Home() {
  const [user, setUser] = useState<any | null>(null)

  const [likes, setLikes] = useState<any | null>(null)

  const fetchUser = () => {
    getUser().then((user) => {
      setUser(user)
    })
  }

  const fetchLikes = () => {
    getLikes().then((likes) => {
      setLikes(likes)
    })
  }


  useEffect(() => {
    if (user) {
      if(user.twitterAccessToken) fetchLikes()
    }
  }, [user])

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })

  const handleChange = (e: any) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    const jwt = localStorage.getItem('jwt')
    if (jwt) {
      getUser().then((user) => {
        setUser(user)
      })
    }
  }, [])


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">

        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            {user && <p> {user.username} </p>}
          </a>
        </div>
        {user && <button
          onClick={() => {
            localStorage.removeItem('jwt')
            setUser(null)
            setLikes(null)
          }}
        > logout </button>}

      </div>

      {!user && <div className='flex flex-col gap-4'>
        <input onChange={handleChange} className='w-40 h-10 rounded-md px-4' placeholder='username' name="username" />
        <input onChange={handleChange} className='w-40 h-10 rounded-md px-4' placeholder='password' name="password" />
        <button onClick={() => {
          login(credentials.username, credentials.password).then((user) => {
            setUser(user)
          })
        }} className='px-4 py-2 bg-black text-white font-bold rounded-lg'> Login </button>
        <button
          onClick={() => {
            register(credentials.username, credentials.password).then((user) => {
              setUser(user)
            })
          }}
          className='px-4 py-2 bg-black text-white font-bold rounded-lg'> Register </button>
      </div>
      }
      {user && <><div className="relative flex place-items-center">
        {
          user.twitterAccessToken ? <button
            onClick={() => {
              disconnectTwitter().then(() => {
                fetchUser()
                setLikes(null)
              })
            }}
            className='border bg-white text-black px-4 py-2 rounded-2xl'> Disconnect twitter </button>
            : <button
              onClick={() => {
                connectTwitter().then((authLink) => {
                  window.open(authLink.url, '_blank')
                })
              }}
              className='border bg-white text-black px-4 py-2 rounded-2xl'> Connect twitter </button>
        }
      </div>
      </>
      }

      {
        likes && <div className="mb-32 flex flex-col items-center justify-center">
          <h1 className='mb-4 font-bold'> Son Like'lar </h1>
          {
            likes.map((tweet: any, index: number) => {
              return <p key={index}> {index + 1} - {tweet} </p>
            })
          }
          {
            likes?.length === 0 && <p> Henüz hiç like yok </p>
          }
        </div>
      }
    </main >
  )
}
