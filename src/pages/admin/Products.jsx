import { useMemo, useState } from 'react';
import { Box, Button, FormControl, FormLabel, Heading, HStack, IconButton, Input, NumberInput, NumberInputField, Select, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text, useDisclosure, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Tag, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Image } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../../services/products';
import { addStockMovement } from '../../services/stock';
import { Edit, Trash2, Plus } from 'lucide-react';

export default function AdminProducts() {
  const toast = useToast();
  const [params] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [tick, setTick] = useState(0);
  const products = useMemo(()=> listProducts(), [tick]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, image: '', dateAdded: '', quantity: 0 });
  const [q, setQ] = useState(initialQ);
  const [stockFilter, setStockFilter] = useState('all'); // all | in | low | out
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [quickAdd, setQuickAdd] = useState({ open: false, product: null, qty: 1, note: '' });

  const openNew = ()=> { setEditing(null); setForm({ name: '', description: '', price: 0, image: '', dateAdded: new Date().toISOString().slice(0,10), quantity: 0 }); onOpen(); };
  const openEdit = (p)=> { setEditing(p); setForm({ name: p.name, description: p.description||'', price: p.price, image: (p.images && p.images[0]) || '', dateAdded: (p.dateAdded ? p.dateAdded.slice(0,10) : new Date().toISOString().slice(0,10)), quantity: Number(p.stock||0) }); onOpen(); };

  const onSubmit = ()=> {
    if (!form.name) { toast({ title: 'กรุณากรอกชื่อสินค้า', status: 'warning' }); return; }
    const dateISO = form.dateAdded ? new Date(form.dateAdded).toISOString() : undefined;
    if (editing) {
      const payload = { name: form.name, description: form.description||'', price: Number(form.price||0), images: form.image ? [form.image] : [], stock: Number(form.quantity||0), dateAdded: dateISO };
      updateProduct(editing.id, payload);
      toast({ title: 'แก้ไขสินค้าแล้ว', status: 'success' });
    } else {
      const payload = { name: form.name, description: form.description||'', price: Number(form.price||0), images: form.image ? [form.image] : [], stock: Number(form.quantity||0), initialStock: Number(form.quantity||0), dateAdded: dateISO };
      createProduct(payload);
      toast({ title: 'เพิ่มสินค้าแล้ว', status: 'success' });
    }
    onClose();
    setTick(t=> t+1);
  };

  const onDelete = (p)=> { deleteProduct(p.id); toast({ title: 'ลบสินค้าแล้ว', status: 'info' }); setTick(t=> t+1); };

  const openQuickAdd = (p)=> {
    setQuickAdd({ open: true, product: p, qty: 1, note: '' });
  };
  const confirmQuickAdd = ()=> {
    try {
      if (!quickAdd.product) return;
      if (!quickAdd.qty || Number(quickAdd.qty) <= 0) { toast({ title: 'กรุณาระบุจำนวนมากกว่า 0', status: 'warning' }); return; }
      addStockMovement({ productId: quickAdd.product.id, type: 'in', qty: Number(quickAdd.qty), note: quickAdd.note || 'เพิ่มสต็อกสินค้าเดิม' });
      toast({ title: 'เพิ่มสต็อกแล้ว', status: 'success' });
      setQuickAdd({ open: false, product: null, qty: 1, note: '' });
      setTick(t=> t+1);
    } catch(e) {
      toast({ title: e.message || 'เกิดข้อผิดพลาด', status: 'error' });
    }
  };

  const stockState = (p) => {
    const stock = Number(p.stock||0);
    if (stock === 0) return 'out';
    const initial = Number(p.initialStock ?? p.stock ?? 0);
    const threshold = initial > 0 ? Math.floor(initial * 0.2) : Number(p.reorderLevel || 0);
    if (initial > 0) {
      if (stock <= Math.floor(initial * 0.2)) return 'low';
    } else if (threshold > 0 && stock <= threshold) {
      return 'low';
    }
    return 'in';
  };

  const filtered = products.filter(p => {
    const matchesQ = (q.trim()==='' || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku?.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase()));
    const s = stockState(p);
    const matchesStock = (stockFilter==='all' || stockFilter===s);
    return matchesQ && matchesStock;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize);
  const goto = (p)=> setPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <Stack spacing={6}>
      <Box>
        <HStack justify="space-between" align="center" mb={3} spacing={4}>
          <Box>
            <Heading size="lg" mb={1}>จัดการสินค้า</Heading>
            <Text fontSize="sm" color="gray.500">ดูรายการสินค้า จัดการสต็อก และเพิ่มสินค้าใหม่เข้าระบบ</Text>
          </Box>
          <HStack spacing={2} justify="flex-end">
            <Input
              placeholder="ค้นหาชื่อหรือ SKU"
              value={q}
              onChange={(e)=> setQ(e.target.value)}
              size="sm"
              maxW="220px"
            />
            <Select
              value={stockFilter}
              onChange={(e)=> setStockFilter(e.target.value)}
              size="sm"
              maxW="160px"
            >
              <option value="all">ทั้งหมด</option>
              <option value="in">มีสินค้า</option>
              <option value="low">สต็อกต่ำ</option>
              <option value="out">สต็อกหมด</option>
            </Select>
            <Button
              colorScheme="blue"
              onClick={openNew}
              size="sm"
              px={4}
              minW="110px"
            >
              <HStack spacing={1} align="center">
                <Plus size={16} />
                <Text>เพิ่มสินค้า</Text>
              </HStack>
            </Button>
          </HStack>
        </HStack>
      </Box>
      <Box bg="white" borderRadius="xl" boxShadow="sm" p={4}>
        <TableContainer>
          <Table size="md">
            <Thead>
              <Tr>
                <Th>SKU</Th>
                <Th>รูปภาพ</Th>
                <Th>ชื่อ</Th>
                <Th>สถานะสต็อก</Th>
                <Th isNumeric>ราคา</Th>
                <Th isNumeric>สต็อก</Th>
                <Th>เข้าเมื่อ</Th>
                <Th>จัดการ</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paged.length === 0 && (
                <Tr>
                  <Td colSpan={8}>
                    <Box py={8} textAlign="center" color="gray.500">ไม่พบข้อมูลสินค้า</Box>
                  </Td>
                </Tr>
              )}
              {paged.map(p => (
                <Tr key={p.id}>
                  <Td><Text noOfLines={1}>{p.sku}</Text></Td>
                  <Td>
                    <Image src={(p.images && p.images[0]) || ''} alt={p.name} boxSize="48px" objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/48x48?text=-" />
                  </Td>
                  <Td><Text noOfLines={1}>{p.name}</Text></Td>
                  <Td>{(() => { const s = stockState(p); return <Tag size="sm" colorScheme={s==='in'?'green':s==='low'?'orange':'red'}>{s==='in'?'มีสินค้า': s==='low'?'สต็อกต่ำ':'สต็อกหมด'}</Tag>; })()}</Td>
                  <Td isNumeric>฿{p.price.toLocaleString()}</Td>
                  <Td isNumeric>{p.stock}</Td>
                  <Td>{p.dateAdded ? new Date(p.dateAdded).toLocaleDateString() : '-'}</Td>
                  <Td>
                    <HStack>
                      <IconButton aria-label="add" icon={<Plus size={16} />} size="sm" colorScheme="green" variant="outline" onClick={()=> openQuickAdd(p)} title="เพิ่มสินค้าเดิม" />
                      <IconButton aria-label="edit" icon={<Edit size={16} />} size="sm" onClick={()=> openEdit(p)} />
                      <IconButton aria-label="delete" icon={<Trash2 size={16} />} size="sm" colorScheme="red" variant="outline" onClick={()=> { setEditing(p); setIsAlertOpen(true); }} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        {/* Quick add stock dialog */}
        <Modal isOpen={quickAdd.open} onClose={()=> setQuickAdd({ open:false, product:null, qty:1, note:'' })}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>เพิ่มสินค้าเดิม</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>สินค้า</FormLabel>
                  <Input value={quickAdd.product?.name || ''} isReadOnly />
                </FormControl>
                <FormControl>
                  <FormLabel>จำนวนที่เพิ่ม</FormLabel>
                  <NumberInput value={quickAdd.qty} min={1} onChange={(v)=> setQuickAdd(s=> ({ ...s, qty: Number(v)||1 }))}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>หมายเหตุ (ถ้ามี)</FormLabel>
                  <Input value={quickAdd.note} onChange={(e)=> setQuickAdd(s=> ({ ...s, note: e.target.value }))} placeholder="เช่น รับเข้าเพื่อเติมสต็อก" />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={()=> setQuickAdd({ open:false, product:null, qty:1, note:'' })}>ยกเลิก</Button>
              <Button colorScheme="blue" onClick={confirmQuickAdd}>เพิ่มสต็อก</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>

      {/* Pagination */}
        <HStack justify="center" mt={4} spacing={1}>
          <Button size="sm" onClick={()=> goto(currentPage-1)} isDisabled={currentPage===1}>ก่อนหน้า</Button>
          {Array.from({length: totalPages}).slice(0,10).map((_,i)=> (
            <Button key={i} size="sm" variant={currentPage===i+1? 'solid':'ghost'} colorScheme={currentPage===i+1?'blue':undefined} onClick={()=> goto(i+1)}>{i+1}</Button>
          ))}
          <Button size="sm" onClick={()=> goto(currentPage+1)} isDisabled={currentPage===totalPages}>ถัดไป</Button>
        </HStack>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel>ชื่อสินค้า</FormLabel>
                <Input value={form.name} onChange={(e)=> setForm({ ...form, name: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>คำอธิบายสินค้า</FormLabel>
                <Input value={form.description} onChange={(e)=> setForm({ ...form, description: e.target.value })} placeholder="รายละเอียดโดยย่อ" />
              </FormControl>
              <FormControl>
                <FormLabel>ราคา</FormLabel>
                <NumberInput value={form.price} onChange={(v)=> setForm({ ...form, price: Number(v)||0 })} min={0}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>วันที่สินค้าเข้า</FormLabel>
                <Input type="date" value={form.dateAdded} onChange={(e)=> setForm({ ...form, dateAdded: e.target.value })} />
              </FormControl>
              
              <FormControl>
                <FormLabel>รูปภาพ (URL)</FormLabel>
                <Input value={form.image} onChange={(e)=> setForm({ ...form, image: e.target.value })} placeholder="https://..." />
              </FormControl>
              <FormControl>
                <FormLabel>จำนวนสินค้าที่เพิ่ม</FormLabel>
                <NumberInput value={form.quantity} onChange={(v)=> setForm({ ...form, quantity: Number(v)||0 })} min={0}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>ยกเลิก</Button>
            <Button colorScheme="blue" onClick={onSubmit}>{editing ? 'บันทึก' : 'เพิ่มสินค้า'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirm */}
      <AlertDialog isOpen={isAlertOpen} onClose={()=> setIsAlertOpen(false)}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>ยืนยันการลบสินค้า</AlertDialogHeader>
            <AlertDialogBody>
              คุณต้องการลบ "{editing?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={()=> setIsAlertOpen(false)} mr={3}>ยกเลิก</Button>
              <Button colorScheme="red" onClick={()=> { if(editing) onDelete(editing); setIsAlertOpen(false); }}>ลบ</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Stack>
  );
}
