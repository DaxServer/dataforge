import { createRouter, createWebHashHistory } from 'vue-router'

// Define routes
const routes = [
  {
    path: '/',
    component: () => import('@frontend/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/open',
      },
      {
        path: 'open',
        name: 'open',
        component: () => import('@frontend/pages/OpenProject.vue'),
        meta: {
          title: 'Open Project',
        },
      },
      {
        path: 'create',
        name: 'create',
        component: () => import('@frontend/pages/CreateProject.vue'),
        meta: {
          title: 'Create Project',
        },
      },
      {
        path: 'project/:id/:tab',
        name: 'ProjectView',
        component: () => import('@frontend/views/ProjectView.vue'),
        meta: {
          title: 'Project View',
        },
      },
    ],
  },
  // Add a catch-all route for 404s
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // Enable smooth scrolling to anchor links
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    } else {
      return { top: 0 }
    }
  },
})

// Set page title based on route meta
// router.beforeEach((to, from, next) => {
//   document.title = to.meta.title ? `OpenRefine - ${to.meta.title}` : 'OpenRefine'
//   next()
// })

export default router
