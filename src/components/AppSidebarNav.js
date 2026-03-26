
// src/components/AppSidebarNav.js
import { defineComponent, h, onMounted, ref, resolveComponent } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { CBadge, CSidebarNav, CNavItem, CNavGroup, CNavTitle } from '@coreui/vue'


import adminNav from '@/2_administrator_BOX/admin_nav'
import principalNav from '@/1_principal_BOX/principal_nav'
import staffNav from '@/4_staff_BOX/staff_nav'
import studentNav from '@/3_student_BOX/student_nav'  // <-- import student nav


import simplebar from 'simplebar-vue'
import 'simplebar-vue/dist/simplebar.min.css'

const normalizePath = (path) =>
  decodeURI(path).replace(/#.*$/, '').replace(/(index)?\.(html)$/, '')

const isActiveLink = (route, link) => {
  if (link === undefined) return false
  if (typeof link === 'object') {
    // If using name-based `to`, rely on RouterLink's `props.isActive`
    return false
  }
  if (route.hash === link) return true
  const currentPath = normalizePath(route.path)
  const targetPath = normalizePath(link)
  return currentPath === targetPath
}

const isActiveItem = (route, item) => {
  if (isActiveLink(route, item.to)) return true
  if (item.items) return item.items.some((child) => isActiveItem(route, child))
  return false
}

const AppSidebarNav = defineComponent({
  name: 'AppSidebarNav',
  components: {
    CNavItem,
    CNavGroup,
    CNavTitle,
  },
  setup() {
    const route = useRoute()
    const firstRender = ref(true)
    onMounted(() => { firstRender.value = false })

    // Read role saved during login
    const userRaw = localStorage.getItem('user')


    const user = userRaw ? JSON.parse(userRaw) : null
    const role = user?.role

    const nav = role === 'administrator'
      ? adminNav
      : role === 'principal'
      ? principalNav
      : role === 'student'
      ? studentNav
      :role === 'staff'
      ? staffNav
      : [] // default empty (or a minimal nav)

    const renderItem = (item) => {
      if (item.items) {
        return h(
          CNavGroup,
          {
            as: 'div',
            compact: true,
            ...(firstRender.value && {
              visible: item.items.some((child) => isActiveItem(route, child)),
            }),
          },
          {
            togglerContent: () => [
              h(resolveComponent('CIcon'), {
                customClassName: 'nav-icon',
                name: item.icon,
              }),
              item.name,
            ],
            default: () => item.items.map((child) => renderItem(child)),
          },
        )
      }

      if (item.href) {
        return h(
          resolveComponent(item.component),
          {
            href: item.href,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          {
            default: () => [
              item.icon
                ? h(resolveComponent('CIcon'), { customClassName: 'nav-icon', name: item.icon })
                : h('span', { class: 'nav-icon' }, h('span', { class: 'nav-icon-bullet' })),
              item.name,
              item.external && h(resolveComponent('CIcon'), {
                class: 'ms-2', name: 'cil-external-link', size: 'sm',
              }),
              item.badge &&
                h(CBadge, { class: 'ms-auto', color: item.badge.color, size: 'sm' }, { default: () => item.badge.text }),
            ],
          },
        )
      }

      return item.to
        ? h(
            RouterLink,
            { to: item.to, custom: true },
            {
              default: (props) =>
                h(
                  resolveComponent(item.component),
                  {
                    active: props.isActive,
                    as: 'div',
                    href: props.href,
                    onClick: () => props.navigate(),
                  },
                  {
                    default: () => [
                      item.icon
                        ? h(resolveComponent('CIcon'), { customClassName: 'nav-icon', name: item.icon })
                        : h('span', { class: 'nav-icon' }, h('span', { class: 'nav-icon-bullet' })),
                      item.name,
                      item.badge &&
                        h(CBadge, { class: 'ms-auto', color: item.badge.color, size: 'sm' }, { default: () => item.badge.text }),
                    ],
                  },
                ),
            },
          )
        : h(resolveComponent(item.component), { as: 'div' }, { default: () => item.name })
    }

    return () =>
      h(
        CSidebarNav,
        { as: simplebar },
        { default: () => nav.map((item) => renderItem(item)) },
      )
  },
})

export { AppSidebarNav }
