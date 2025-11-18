import { Outlet, NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import {
  Box, Container, Flex, HStack, Text, Icon, Badge, Button,
  Avatar, Menu, MenuButton, MenuItem, MenuList, useToast,
  VStack, SimpleGrid, Divider, IconButton, Link
} from '@chakra-ui/react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { getCurrentUser, logout } from '../services/auth';

export default function CustomerLayout() {
  const count = useCartStore((s) => s.count());
  const user = getCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();

  // ✅ ฟังก์ชันสร้างลิงก์พร้อม active style
  const NavItem = ({ to, label, end }) => (
    <RouterNavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        color: isActive ? '#2B6CB0' : '#2D3748', // blue.600 / gray.700
        fontWeight: isActive ? 600 : 500,
        textDecoration: isActive ? 'underline' : 'none',
        transition: '0.2s',
      })}
    >
      {label}
    </RouterNavLink>
  );

  return (
    <Box minH="100vh" bg="gray.50" display="flex" flexDirection="column">
      {/* Header Navbar */}
      <Box bg="white" boxShadow="sm">
        <Container maxW="6xl" py={3}>
          <Flex align="center" justify="space-between">
            <Link as={RouterNavLink} to="/" fontSize="xl" fontWeight="bold" _hover={{ textDecoration: 'none' }}>
              InventoryX
            </Link>

            <HStack spacing={6} fontWeight="medium">
              <NavItem to="/" label="หน้าแรก" end />
              <NavItem to="/products" label="สินค้า" />
              <RouterNavLink
                to="/cart"
                style={({ isActive }) => ({
                  color: isActive ? '#2B6CB0' : '#2D3748',
                  fontWeight: isActive ? 600 : 500,
                  position: 'relative',
                  textDecoration: isActive ? 'underline' : 'none',
                })}
              >
                <HStack spacing={1}>
                  <Icon as={ShoppingCart} />
                  <Text as="span">ตะกร้า</Text>
                </HStack>
                {count > 0 && (
                  <Badge
                    colorScheme="red"
                    position="absolute"
                    top={-2}
                    right={-3}
                    borderRadius="full"
                  >
                    {count}
                  </Badge>
                )}
              </RouterNavLink>

              {!user && <NavItem to="/login" label="เข้าสู่ระบบ" />}
              {!user && <NavItem to="/register" label="สมัครสมาชิก" />}

              {user && (
                <Menu>
                  <MenuButton as={Button} variant="ghost" px={0}>
                    <HStack spacing={2}>
                      <Avatar size="sm" name={user.name} />
                      <Text display={{ base: 'none', md: 'inline' }}>{user.name}</Text>
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => navigate('/profile')}>โปรไฟล์</MenuItem>
                    <MenuItem onClick={() => navigate('/orders')}>คำสั่งซื้อของฉัน</MenuItem>
                    <MenuItem
                      onClick={() => {
                        logout();
                        toast({ title: 'ออกจากระบบแล้ว', status: 'info' });
                        navigate('/');
                      }}
                    >
                      ออกจากระบบ
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main content */}
      <Container maxW="6xl" py={6} flex="1">
        <Outlet />
      </Container>

      {/* Footer */}
      <Box as="footer" bg="gray.900" color="white" mt={8} pt={10} pb={6}>
        <Container maxW="6xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
            <VStack align="flex-start" spacing={3}>
              <Text fontSize="xl" fontWeight="bold">InventoryX</Text>
              <Text color="gray.300">แพลตฟอร์มจัดการสินค้าและคำสั่งซื้อที่เรียบง่าย แต่ทรงพลัง</Text>
              <HStack spacing={2} pt={1}>
                <IconButton aria-label="Facebook" icon={<Icon name="facebook" />} size="sm" variant="ghost" colorScheme="whiteAlpha" />
                <IconButton aria-label="Twitter" icon={<Icon name="twitter" />} size="sm" variant="ghost" colorScheme="whiteAlpha" />
                <IconButton aria-label="Instagram" icon={<Icon name="instagram" />} size="sm" variant="ghost" colorScheme="whiteAlpha" />
              </HStack>
            </VStack>

            <VStack align="flex-start" spacing={2}>
              <Text fontWeight="semibold">เมนู</Text>
              <NavItem to="/" label="หน้าแรก" end />
              <NavItem to="/products" label="สินค้า" />
              <NavItem to="/cart" label="ตะกร้า" />
            </VStack>

            <VStack align="flex-start" spacing={2}>
              <Text fontWeight="semibold">บัญชีของฉัน</Text>
              <NavItem to="/orders" label="คำสั่งซื้อของฉัน" />
              <NavItem to="/profile" label="โปรไฟล์" />
              {!user && <NavItem to="/login" label="เข้าสู่ระบบ" />}
            </VStack>

            <VStack align="flex-start" spacing={2}>
              <Text fontWeight="semibold">ติดต่อเรา</Text>
              <Text color="gray.300">อีเมล: support@inventoryx.app</Text>
              <Text color="gray.300">โทร: 02-123-4567</Text>
              <Text color="gray.500" fontSize="sm">จันทร์–ศุกร์ 09:00–18:00 น.</Text>
            </VStack>
          </SimpleGrid>

          <Divider my={6} borderColor="whiteAlpha.300" />
          <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={3}>
            <Text color="gray.400">© {new Date().getFullYear()} InventoryX. All rights reserved.</Text>
            <HStack spacing={5} color="gray.300">
              <Link href="#">เงื่อนไขการใช้บริการ</Link>
              <Link href="#">นโยบายความเป็นส่วนตัว</Link>
              <Link href="#">ศูนย์ช่วยเหลือ</Link>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
