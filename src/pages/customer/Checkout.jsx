import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Divider, FormControl, FormLabel, Heading, HStack, Input, Stack, Text, useToast } from '@chakra-ui/react';
import { useCartStore } from '../../store/cartStore';
import { getCurrentUser } from '../../services/auth';
import { createOrder } from '../../services/orders';
import { fetchAdminProducts } from '../../services/products';
import CheckoutSteps from '../../components/CheckoutSteps';
import { fetchDefaultAddress } from '../../services/addresses';

export default function Checkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const items = useCartStore((s)=> s.items);
  const clear = useCartStore((s)=> s.clear);
  const user = getCurrentUser();
  const [productsMap, setProductsMap] = useState({});
  const [defaultAddressId, setDefaultAddressId] = useState(null);

  const [form, setForm] = useState({
    fullName: user?.fullName || user?.name || '',
    phone: user?.phoneNumber || user?.phone || '',
    line1: '',
    district: '',
    province: '',
    zipcode: '',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const addr = await fetchDefaultAddress();
        if (!active || !addr) return;
        setDefaultAddressId(addr.id || null);
        setForm(prev => ({
          ...prev,
          fullName: addr.recipientName || prev.fullName,
          phone: addr.phoneNumber || prev.phone,
          line1: addr.addressLine1 || prev.line1,
          district: addr.district || prev.district,
          province: addr.province || prev.province,
          zipcode: addr.postalCode || prev.zipcode,
        }));
      } catch {
        // ถ้าไม่มี default address หรือโหลดไม่สำเร็จ ให้ใช้ค่าจาก user ต่อไป
      }
    })();
    return () => { active = false; };
  }, []);

  // โหลดข้อมูลสินค้าเหมือนหน้า Cart เพื่อใช้ join กับ items
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchAdminProducts();
        if (!active) return;
        const map = {};
        list.forEach(p => { map[p.id] = p; });
        setProductsMap(map);
      } catch (e) {
        toast({ title: e.message || 'โหลดสินค้าไม่สำเร็จ', status: 'error' });
      }
    })();
    return () => { active = false; };
  }, [toast]);

  const rows = useMemo(
    () => items.map(i => ({ ...i, product: productsMap[i.productId] })).filter(r => !!r.product),
    [items, productsMap]
  );
  const total = useMemo(
    () => rows.reduce((sum, { product, qty }) => sum + Number(product.price || 0) * qty, 0),
    [rows]
  );

  const onPlaceOrder = async () => {
    if (!user) {
      toast({ title: 'กรุณาเข้าสู่ระบบก่อนชำระเงิน', status: 'warning' });
      navigate('/login');
      return;
    }
    if (rows.length === 0) {
      toast({ title: 'ตะกร้าสินค้าว่างเปล่า', status: 'warning' });
      navigate('/products');
      return;
    }
    try {
      const payloadItems = items.map(i => ({ productId: i.productId, quantity: i.qty }));
      const order = await createOrder({
        shippingAddressId: defaultAddressId || undefined,
        items: payloadItems,
      });
      clear();
      toast({ title: 'สร้างคำสั่งซื้อสำเร็จ', status: 'success' });
      navigate(`/orders`);
    } catch (e) {
      toast({ title: e.message || 'สร้างคำสั่งซื้อไม่สำเร็จ', status: 'error' });
    }
  };

  return (
    <Stack spacing={6}>
      <CheckoutSteps current={2} />
      <Heading size="lg">ชำระเงิน</Heading>
      <Stack direction={{ base:'column', lg:'row' }} spacing={6} align="start">
        {/* Left: address */}
        <Box flex="1" bg="white" borderRadius="xl" boxShadow="sm" p={6} w="full">
          <Heading size="sm" mb={4}>ที่อยู่จัดส่ง</Heading>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>ชื่อ-นามสกุล</FormLabel>
              <Input value={form.fullName} onChange={(e)=> setForm({ ...form, fullName: e.target.value })} />
            </FormControl>
            <HStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>เบอร์โทร</FormLabel>
                <Input value={form.phone} onChange={(e)=> setForm({ ...form, phone: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>รหัสไปรษณีย์</FormLabel>
                <Input value={form.zipcode} onChange={(e)=> setForm({ ...form, zipcode: e.target.value })} />
              </FormControl>
            </HStack>
            <FormControl isRequired>
              <FormLabel>ที่อยู่</FormLabel>
              <Input value={form.line1} onChange={(e)=> setForm({ ...form, line1: e.target.value })} placeholder="บ้านเลขที่ ถนน ซอย" />
            </FormControl>
            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>อำเภอ/เขต</FormLabel>
                <Input value={form.district} onChange={(e)=> setForm({ ...form, district: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>จังหวัด</FormLabel>
                <Input value={form.province} onChange={(e)=> setForm({ ...form, province: e.target.value })} />
              </FormControl>
            </HStack>
          </Stack>
        </Box>

        {/* Right: summary */}
        <Box w={{ base:'full', lg:'380px' }} bg="white" borderRadius="xl" boxShadow="sm" p={6} position="sticky" top={4}>
          <Heading size="sm" mb={4}>สรุปรายการ</Heading>
          <Stack spacing={2} mb={3}>
            {rows.map(({ product, qty })=> (
              <HStack key={product.id} justify="space-between">
                <Text noOfLines={1}>{product.name} × {qty}</Text>
                <Text>฿{(product.price * qty).toLocaleString()}</Text>
              </HStack>
            ))}
          </Stack>
          <Divider my={3} />
          <HStack justify="space-between" mb={2}><Text color="gray.600">ค่าสินค้า</Text><Text>฿{total.toLocaleString()}</Text></HStack>
          <HStack justify="space-between" mb={4}><Text color="gray.600">ค่าจัดส่ง</Text><Text>คำนวณตอนจัดส่ง</Text></HStack>
          <HStack justify="space-between" mb={4}><Text fontWeight="bold">ยอดรวม</Text><Text fontWeight="bold">฿{total.toLocaleString()}</Text></HStack>
          <Button colorScheme="blue" w="full" onClick={onPlaceOrder}>ยืนยันคำสั่งซื้อ</Button>
        </Box>
      </Stack>
    </Stack>
  );
}
