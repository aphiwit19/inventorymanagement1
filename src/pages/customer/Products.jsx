import { useMemo, useState } from 'react';
import { AspectRatio, Box, Button, Flex, Heading, HStack, Image, Input, Select, SimpleGrid, Stack, Tag, Text, useToast } from '@chakra-ui/react';
import { listProducts } from '../../services/products';
import { useCartStore } from '../../store/cartStore';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

export default function Products() {
  const toast = useToast();
  const add = useCartStore((s)=> s.add);
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const products = listProducts();

  const filtered = useMemo(()=>{
    let p = products.filter(x => (x.name + ' ' + x.sku + ' ' + x.category).toLowerCase().includes(q.toLowerCase()));
    if (sort === 'price_asc') p = p.sort((a,b)=> a.price - b.price);
    if (sort === 'price_desc') p = p.sort((a,b)=> b.price - a.price);
    return p;
  }, [products, q, sort]);

  const imgOf = (p) => (p.images && p.images[0]) || `https://picsum.photos/seed/${p.id}/600/400`;

  // Pagination
  const perPage = 9;
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);
  const setPage = (p)=> setParams(prev => { const np = new URLSearchParams(prev); np.set('page', String(p)); return np; });
  const resetToFirst = ()=> setPage(1);
  const pageRange = ()=> {
    const span = 5;
    let s = Math.max(1, current - Math.floor(span/2));
    let e = Math.min(totalPages, s + span - 1);
    s = Math.max(1, e - span + 1);
    return Array.from({ length: e - s + 1 }, (_, i)=> s + i);
  };

  return (
    <Stack spacing={6}>
      <Box bgGradient="linear(to-r, blue.500, purple.500)" borderRadius="xl" p={{base:6, md:10}} color="white">
        <Heading size="lg">เลือกสินค้าของคุณ</Heading>
        <Text mt={2} color="whiteAlpha.900">สินค้าพร้อมส่ง ปรับจำนวนได้ก่อนชำระเงิน</Text>
      </Box>

      <Flex gap={3} align={{base:'stretch', md:'center'}} direction={{base:'column', md:'row'}}>
        <Input placeholder="ค้นหาสินค้า..." value={q} onChange={(e)=>{ setQ(e.target.value); resetToFirst(); }} maxW={{md:'sm'}} />
        <HStack spacing={3} ml="auto">
          <Select value={sort} onChange={(e)=>{ setSort(e.target.value); resetToFirst(); }} maxW="48">
            <option value="new">สินค้าใหม่</option>
            <option value="price_asc">ราคาต่ำ-สูง</option>
            <option value="price_desc">ราคาสูง-ต่ำ</option>
          </Select>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={5}>
        {pageItems.map(p => (
          <Box key={p.id} bg="white" borderRadius="xl" boxShadow="sm" p={5} _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }} transition="all .2s">
            <AspectRatio ratio={4/3} mb={3}>
              <Image src={imgOf(p)} alt={p.name} objectFit="cover" borderRadius="md" bg="gray.50" />
            </AspectRatio>
            <HStack justify="space-between" mb={1}>
              {(() => {
                const stock = Number(p.stock||0);
                const initial = Number(p.initialStock ?? p.stock ?? 0);
                const threshold = initial > 0 ? Math.floor(initial * 0.2) : 0;
                const isOut = stock === 0;
                const isLow = !isOut && initial > 0 && stock <= threshold;
                const label = isOut ? 'หมดสต็อก' : isLow ? 'สต็อกต่ำ' : 'พร้อมส่ง';
                const color = isOut ? 'red' : isLow ? 'orange' : 'green';
                return <Tag colorScheme={color}>{label}</Tag>;
              })()}
              <Text fontWeight="bold">฿{p.price.toLocaleString()}</Text>
            </HStack>
            <Heading size="sm" mb={1}>{p.name}</Heading>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" color="gray.600">คงเหลือ {Number(p.stock||0)} ชิ้น</Text>
            </HStack>
            <Text noOfLines={2} color="gray.600" mb={4}>{p.description}</Text>
            <HStack justify="space-between">
              <Button as={RouterLink} to={`/product/${p.id}`} variant="outline" size="sm">ดูรายละเอียด</Button>
              {(() => { const out = Number(p.stock||0) === 0; return (
                <Button colorScheme={out? 'gray':'blue'} size="sm" isDisabled={out} onClick={()=>{ if(!out){ add(p.id, 1); toast({ title: 'เพิ่มลงตะกร้าแล้ว', status: 'success', duration: 1200 }); }}}>
                  {out? 'หมดสต็อก' : 'เพิ่มลงตะกร้า'}
                </Button>
              ); })()}
            </HStack>
          </Box>
        ))}
      </SimpleGrid>

      {/* Pagination */}
      <HStack justify="center" spacing={1}>
        <Button size="sm" variant="ghost" isDisabled={current === 1} onClick={()=> setPage(current - 1)}>ก่อนหน้า</Button>
        {pageRange().map(p => (
          <Button key={p} size="sm" variant={p === current ? 'solid' : 'outline'} colorScheme={p === current ? 'blue' : undefined} onClick={()=> setPage(p)}>
            {p}
          </Button>
        ))}
        <Button size="sm" variant="ghost" isDisabled={current === totalPages} onClick={()=> setPage(current + 1)}>ถัดไป</Button>
      </HStack>
    </Stack>
  );
}
