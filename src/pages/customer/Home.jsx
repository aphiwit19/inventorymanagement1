import { useEffect, useState } from 'react';
import { Box, Button, Heading, HStack, Image, Link, SimpleGrid, Stack, Text, useToast } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { fetchAdminProducts } from '../../services/products';
import { useCartStore } from '../../store/cartStore';

export default function Home() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const imgOf = (p) => (p.images && p.images[0]) || `https://picsum.photos/seed/${p.id}/800/600`;
  const add = useCartStore((s)=> s.add);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const items = await fetchAdminProducts();
        if (active) setProducts(items.filter(p => p.status !== 'inactive').slice(0, 6));
      } catch (e) {
        toast({ title: e.message || 'โหลดสินค้าไม่สำเร็จ', status: 'error' });
      }
    })();
    return () => { active = false; };
  }, [toast]);
  return (
    <Stack spacing={8}>
      {/* Hero: เรียบง่าย ใช้งานง่าย แต่ดูพรีเมียม */}
      <Box bgGradient="linear(to-r, blue.500, purple.500)" borderRadius="2xl" p={{ base: 7, md: 12 }} color="white">
        <Stack spacing={4} textAlign={{ base: 'left' }}>
          <Heading fontSize={{ base: '2xl', md: '4xl' }} lineHeight={1.2}>ช้อปสินค้าอย่างมั่นใจ จัดการออเดอร์ได้ในที่เดียว</Heading>
          <Text color="whiteAlpha.900" fontSize={{ base: 'md', md: 'lg' }}>เรียบง่าย เร็ว และใช้งานง่ายบนทุกอุปกรณ์</Text>
          <HStack spacing={3}>
            <Button as={RouterLink} to="/products" colorScheme="whiteAlpha" bg="white" color="blue.700" _hover={{ bg: 'whiteAlpha.900' }}>เริ่มต้นเลือกสินค้า</Button>
          </HStack>
        </Stack>
      </Box>

      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">สินค้าแนะนำ</Heading>
          <Link as={RouterLink} to="/products" color="blue.600" fontWeight="medium">ดูทั้งหมด</Link>
        </HStack>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={5}>
          {products.map((p)=> (
            <Box key={p.id} bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden" _hover={{ boxShadow: 'md', transform: 'translateY(-4px)' }} transition="all .2s">
              <Image src={imgOf(p)} alt={p.name} objectFit="cover" w="100%" h="180px" />
              <Box p={5}>
                <HStack justify="space-between" mb={1}>
                  <Heading size="sm">{p.name}</Heading>
                  <Text fontWeight="bold">฿{p.price.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="xs" color="gray.600">คงเหลือ {Number(p.stock||0)} ชิ้น</Text>
                </HStack>
                <Text color="gray.600" noOfLines={2} mb={4}>{p.description}</Text>
                <HStack justify="space-between">
                  <Button as={RouterLink} to={`/product/${p.id}`} variant="outline" size="sm">ดูรายละเอียด</Button>
                  <Button colorScheme="blue" size="sm" onClick={()=> add(p.id, 1)}>เลือกเพิ่ม</Button>
                </HStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      
    </Stack>
  );
}
