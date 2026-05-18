<?php
require '/var/www/html/vendor/autoload.php';

$s = \PhpOffice\PhpSpreadsheet\IOFactory::load('/var/www/html/Calculateur_RHF.xlsm');
$sheet = $s->getSheetByName('Feuille calcul CIQ+BDD');

$row = $sheet->getRowIterator(1, 1)->current();
$cells = $row->getCellIterator();
$cells->setIterateOnlyExistingCells(false);

$i = 0;
foreach ($cells as $cell) {
    $v = $cell->getValue();
    if ($v !== null && $v !== '') {
        $hex = bin2hex(mb_strtolower((string)$v));
        echo "col $i: [" . $v . "] hex=" . $hex . "\n";
    }
    if ($i++ > 20) break;
}
